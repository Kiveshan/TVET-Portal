import { parquetMetadata, parquetReadObjects, parquetSchema } from 'hyparquet';
import type { FileCellValue } from '@/types/submission';

// Mock-only: the real backend reads Parquet server-side and sends JSON rows.

export interface ParquetContents {
  columns: string[];
  rows: Record<string, FileCellValue>[];
}

/** Parquet values -> JSON-friendly cells (int64 arrives as bigint, timestamps as Date). */
function toCell(value: unknown): FileCellValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString().replace('Z', '');
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value);
}

const cache = new Map<string, Promise<ArrayBuffer>>();

function fetchFile(url: string): Promise<ArrayBuffer> {
  let request = cache.get(url);
  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
      return response.arrayBuffer();
    });
    request.catch(() => cache.delete(url));
    cache.set(url, request);
  }
  return request;
}

export async function readParquetRowCount(url: string): Promise<number> {
  return Number(parquetMetadata(await fetchFile(url)).num_rows);
}

export async function readParquet(url: string): Promise<ParquetContents> {
  const file = await fetchFile(url);
  const columns = parquetSchema(parquetMetadata(file)).children.map((child) => child.element.name);
  const rows = await parquetReadObjects({ file });
  return {
    columns,
    rows: rows.map((row) => Object.fromEntries(columns.map((key) => [key, toCell(row[key])]))),
  };
}
