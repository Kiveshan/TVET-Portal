import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, type _Object } from '@aws-sdk/client-s3';
import {
  parquetMetadataAsync,
  parquetReadObjects,
  parquetSchema,
  type AsyncBuffer,
  type SchemaElement,
} from 'hyparquet';
import { parquetWriteBuffer } from 'hyparquet-writer';
import { env } from '../../config/env.ts';
import { s3 } from '../../lib/s3.ts';

// Everything that touches S3: listing extractor runs in the landing bucket, reading their
// Parquet files, and writing approved rows to the approved bucket.

/**
 * One extractor run in the landing bucket. Each run is a folder:
 *   client=<client>/table=<table>/ingest_date=<YYYY-MM-DD>/run_id=<uuid>/
 * holding part-NNNN.parquet files, a _MANIFEST.json and, once complete, a _SUCCESS marker.
 */
export interface Run {
  path: string;
  client: string;
  table: string;
  ingestDate: string;
  runId: string;
  /** When the run finished uploading; later runs win when the same row appears twice. */
  lastModified: number;
  files: ParquetFile[];
}

interface ParquetFile {
  key: string;
  size: number;
}

/** What a run's Parquet files say about colleges. Runs never change, so this is cached for good. */
export interface RunColleges {
  providerCodes: Set<string>;
  /** Only college_information runs have names: provider code -> college name. */
  names: Map<string, string>;
}

export type RawRow = Record<string, unknown>;

/** Rows of one table with the Parquet schema they were read with (reused when writing them out). */
export interface TableRows {
  schema: SchemaElement[];
  columns: string[];
  rows: RawRow[];
}

const RUN_KEY = /^(client=([^/]+)\/table=([^/]+)\/ingest_date=(\d{4}-\d{2}-\d{2})\/run_id=([^/]+)\/)(.+)$/;

// Tables spell the column differently: PROVIDER_CODE (college_information) or "Provider Code".
const PROVIDER_CODE_COLUMN = /^provider[ _]code$/i;
const COLLEGE_NAME_COLUMN = 'College name';

export const cleanCode = (value: unknown) =>
  value === null || value === undefined ? '' : String(value).trim();

async function listAllObjects(bucket: string): Promise<_Object[]> {
  const objects: _Object[] = [];
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    objects.push(...(page.Contents ?? []));
    token = page.NextContinuationToken;
  } while (token);
  return objects;
}

/** Completed runs in the landing bucket. Runs without _SUCCESS are still being written (or failed). */
export async function listRuns(): Promise<Run[]> {
  const runs = new Map<string, Run & { complete: boolean }>();

  for (const object of await listAllObjects(env.INGESTION_BUCKET)) {
    const match = object.Key?.match(RUN_KEY);
    if (!match) continue;
    const [, path, client, table, ingestDate, runId, file] = match;

    let run = runs.get(path);
    if (!run) {
      run = { path, client, table, ingestDate, runId, lastModified: 0, files: [], complete: false };
      runs.set(path, run);
    }
    run.lastModified = Math.max(run.lastModified, object.LastModified?.getTime() ?? 0);
    if (file === '_SUCCESS') run.complete = true;
    if (file.endsWith('.parquet')) run.files.push({ key: object.Key!, size: object.Size ?? 0 });
  }

  return [...runs.values()]
    .filter((run) => run.complete && run.files.length > 0)
    .map(({ complete: _complete, ...run }) => run);
}

/** Lets hyparquet fetch only the byte ranges it needs (footer + wanted columns), not whole files. */
function s3Buffer({ key, size }: ParquetFile): AsyncBuffer {
  return {
    byteLength: size,
    async slice(start, end = size) {
      const response = await s3.send(
        new GetObjectCommand({ Bucket: env.INGESTION_BUCKET, Key: key, Range: `bytes=${start}-${end - 1}` }),
      );
      const bytes = await response.Body!.transformToByteArray();
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    },
  };
}

async function openParquet(parquetFile: ParquetFile) {
  const file = s3Buffer(parquetFile);
  const metadata = await parquetMetadataAsync(file);
  const columns = parquetSchema(metadata).children.map((child) => child.element.name);
  return { file, metadata, columns, codeColumn: columns.find((c) => PROVIDER_CODE_COLUMN.test(c)) };
}

export async function readRunColleges(run: Run): Promise<RunColleges> {
  const providerCodes = new Set<string>();
  const names = new Map<string, string>();

  for (const parquetFile of run.files) {
    const { file, metadata, columns, codeColumn } = await openParquet(parquetFile);
    if (!codeColumn) continue;
    const hasNames = columns.includes(COLLEGE_NAME_COLUMN);

    const rows = await parquetReadObjects({
      file,
      metadata,
      columns: hasNames ? [codeColumn, COLLEGE_NAME_COLUMN] : [codeColumn],
    });
    for (const row of rows) {
      const code = cleanCode(row[codeColumn]);
      if (!code) continue;
      providerCodes.add(code);
      const name = hasNames ? cleanCode(row[COLLEGE_NAME_COLUMN]) : '';
      if (name) names.set(code, name);
    }
  }

  return { providerCodes, names };
}

/** The row's id within its table: the source system's RecId. */
export const rowIdOf = (row: RawRow) => cleanCode(row.RecId);

/**
 * Every row in `runs` whose provider code is one of `providerCodes`. When a row (same RecId)
 * appears in more than one run, the latest run's copy wins. Columns follow the latest run.
 */
export async function readTableRows(runs: Run[], providerCodes: Set<string>): Promise<TableRows> {
  const ordered = [...runs].sort((a, b) => a.lastModified - b.lastModified);
  const byId = new Map<string, RawRow>();
  let schema: SchemaElement[] = [];
  let columns: string[] = [];

  for (const run of ordered) {
    for (const parquetFile of run.files) {
      const { file, metadata, columns: fileColumns, codeColumn } = await openParquet(parquetFile);
      if (!codeColumn) continue;
      schema = metadata.schema;
      columns = fileColumns;
      for (const row of await parquetReadObjects({ file, metadata })) {
        if (!providerCodes.has(cleanCode(row[codeColumn]))) continue;
        byId.set(rowIdOf(row) || `${run.runId}:${byId.size}`, row);
      }
    }
  }

  const rows = [...byId.values()].sort((a, b) => Number(rowIdOf(a)) - Number(rowIdOf(b)));
  return { schema, columns, rows };
}

/** Writes rows as one Parquet file with the same schema they were read with. */
function toParquet({ schema, columns }: TableRows, rows: RawRow[]): Uint8Array {
  const buffer = parquetWriteBuffer({
    schema,
    columnData: columns.map((name) => ({ name, data: rows.map((row) => row[name] ?? null) })),
  });
  return new Uint8Array(buffer);
}

/**
 * Puts approved rows in the approved bucket:
 *   college=<slug>/table=<table>/ingest_date=<date>/review_id=<id>/part-0000.parquet
 * next to a _REVIEW.json describing the decision. Returns the Parquet file's key.
 */
export async function writeApprovedRows(
  folder: string,
  table: TableRows,
  rows: RawRow[],
  review: Record<string, unknown>,
): Promise<string> {
  const key = `${folder}part-0000.parquet`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.APPROVED_BUCKET,
      Key: key,
      Body: toParquet(table, rows),
      ContentType: 'application/vnd.apache.parquet',
    }),
  );
  await s3.send(
    new PutObjectCommand({
      Bucket: env.APPROVED_BUCKET,
      Key: `${folder}_REVIEW.json`,
      Body: JSON.stringify(review, null, 2),
      ContentType: 'application/json',
    }),
  );
  return key;
}
