import { randomUUID } from 'node:crypto';
import type { ReviewStatus } from '../../generated/prisma/enums.ts';
import { prisma } from '../../lib/prisma.ts';
import { HttpError } from '../../utils/HttpError.ts';
import type { SessionUser } from '../users/user.mapper.ts';
import {
  listRuns,
  readRunColleges,
  readTableRows,
  rowIdOf,
  writeApprovedRows,
  type RawRow,
  type Run,
  type RunColleges,
  type TableRows,
} from './submissions.bucket.ts';
import type { ReviewBody } from './submissions.schemas.ts';

// A submission is one college's data for one ingest date: the rows for that college from every
// run that landed that day, grouped by table. Only the tables that arrived that day are included.

type ApiStatus = 'awaiting' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  /** ISO date (YYYY-MM-DD): the ingest date. */
  submittedOn: string;
  college: string;
  fileName: string;
  financialYear: string;
  status: ApiStatus;
  /** Tables in the submission, e.g. "staff_data". */
  tables: string[];
}

interface SubmissionGroup {
  id: string;
  college: string;
  ingestDate: string;
  providerCodes: Set<string>;
  /** Table name -> the runs that landed that day. */
  runs: Map<string, Run[]>;
}

/** "Majuba TVET College" -> "majuba-tvet-college" */
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "college_information" -> "College information" */
const tableLabel = (table: string) => {
  const words = table.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** South African government financial year (April to March), e.g. 2026-10-21 -> "2026/27". */
function financialYear(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number);
  const start = month >= 4 ? year : year - 1;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

/** Parquet values -> JSON cells: int64 arrives as bigint and timestamps as Date. */
function toCell(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString().replace('Z', '');
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value);
}

const toCells = (row: RawRow, columns: string[]) =>
  Object.fromEntries(columns.map((column) => [column, toCell(row[column])]));

/** Runs `work` over `items`, at most `limit` at a time, keeping the input order. */
async function mapWithLimit<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------------------------
// Grouping runs into submissions

const runColleges = new Map<string, Promise<RunColleges>>();

function collegesFor(run: Run): Promise<RunColleges> {
  let result = runColleges.get(run.path);
  if (!result) {
    result = readRunColleges(run);
    result.catch(() => runColleges.delete(run.path));
    runColleges.set(run.path, result);
  }
  return result;
}

async function loadGroups(): Promise<SubmissionGroup[]> {
  const runs = await listRuns();
  const details = await mapWithLimit(runs, 8, collegesFor);

  // Only college_information names colleges; its provider codes identify the other tables' rows.
  const collegeByCode = new Map<string, string>();
  details.forEach(({ names }) => names.forEach((name, code) => collegeByCode.set(code, name)));

  const groups = new Map<string, SubmissionGroup>();
  runs.forEach((run, index) => {
    for (const code of details[index].providerCodes) {
      const college = collegeByCode.get(code);
      if (!college) continue;
      const id = `${run.ingestDate}--${slug(college)}`;
      let group = groups.get(id);
      if (!group) {
        group = { id, college, ingestDate: run.ingestDate, providerCodes: new Set(), runs: new Map() };
        groups.set(id, group);
      }
      group.providerCodes.add(code);
      const tableRuns = group.runs.get(run.table) ?? [];
      if (!tableRuns.includes(run)) tableRuns.push(run);
      group.runs.set(run.table, tableRuns);
    }
  });

  return [...groups.values()].sort(
    (a, b) => b.ingestDate.localeCompare(a.ingestDate) || a.college.localeCompare(b.college),
  );
}

// Listing the bucket on every request is slow, so the grouping is reused for a minute.
const CACHE_MS = 60_000;
let cachedGroups: { at: number; groups: Promise<SubmissionGroup[]> } | null = null;

function allGroups(): Promise<SubmissionGroup[]> {
  if (!cachedGroups || Date.now() - cachedGroups.at > CACHE_MS) {
    const groups = loadGroups();
    cachedGroups = { at: Date.now(), groups };
    groups.catch(() => {
      cachedGroups = null;
    });
  }
  return cachedGroups.groups;
}

/** Starts reading the bucket in the background, so the first page load does not wait. */
export function warmCache() {
  allGroups().catch((error) => console.error('Could not read the S3 ingestion bucket:', error));
}

/** TVET users only see their own college; DHET sees every college. */
function canSee(user: SessionUser, group: SubmissionGroup) {
  if (user.role === 'DHET') return true;
  return user.institution?.name.trim().toLowerCase() === group.college.toLowerCase();
}

async function findGroup(user: SessionUser, submissionId: string): Promise<SubmissionGroup> {
  const group = (await allGroups()).find((candidate) => candidate.id === submissionId);
  // Someone else's submission is reported as missing, not forbidden, so ids cannot be probed.
  if (!group || !canSee(user, group)) throw new HttpError(404, 'Submission not found');
  return group;
}

/** Any rejected table rejects the submission; it is approved once every table is approved. */
function statusOf(group: SubmissionGroup, decisions: Map<string, ReviewStatus>): ApiStatus {
  const tables = [...group.runs.keys()];
  if (tables.some((table) => decisions.get(table) === 'REJECTED')) return 'rejected';
  if (tables.every((table) => decisions.get(table) === 'APPROVED')) return 'approved';
  return 'awaiting';
}

function toSubmission(group: SubmissionGroup, decisions: Map<string, ReviewStatus>): Submission {
  return {
    id: group.id,
    submittedOn: group.ingestDate,
    college: group.college,
    fileName: `${slug(group.college)}-${group.ingestDate}.parquet`,
    financialYear: financialYear(group.ingestDate),
    status: statusOf(group, decisions),
    tables: [...group.runs.keys()].sort(),
  };
}

/** Decisions per submission: submission id -> table -> status. */
async function decisionsFor(submissionIds: string[]) {
  const reviews = await prisma.submissionReview.findMany({
    where: { submission_id: { in: submissionIds } },
    select: { submission_id: true, table_name: true, status: true },
  });
  const decisions = new Map<string, Map<string, ReviewStatus>>();
  for (const review of reviews) {
    const tables = decisions.get(review.submission_id) ?? new Map<string, ReviewStatus>();
    tables.set(review.table_name, review.status);
    decisions.set(review.submission_id, tables);
  }
  return decisions;
}

export async function listSubmissions(user: SessionUser): Promise<Submission[]> {
  const groups = (await allGroups()).filter((group) => canSee(user, group));
  const decisions = await decisionsFor(groups.map((group) => group.id));
  return groups.map((group) => toSubmission(group, decisions.get(group.id) ?? new Map()));
}

export async function getSubmission(user: SessionUser, submissionId: string): Promise<Submission> {
  const group = await findGroup(user, submissionId);
  const decisions = await decisionsFor([group.id]);
  return toSubmission(group, decisions.get(group.id) ?? new Map());
}

// ---------------------------------------------------------------------------------------------
// Rows of one table

// Reading a table means downloading whole Parquet files, so recent reads are kept for a while.
const ROWS_CACHE_MS = 10 * 60_000;
const ROWS_CACHE_SIZE = 20;
const rowsCache = new Map<string, { at: number; rows: Promise<TableRows> }>();

function tableRows(group: SubmissionGroup, table: string): Promise<TableRows> {
  const runs = group.runs.get(table);
  if (!runs) throw new HttpError(404, 'File not found');

  const key = `${group.id}/${table}/${runs.map((run) => run.runId).join(',')}`;
  const hit = rowsCache.get(key);
  if (hit && Date.now() - hit.at < ROWS_CACHE_MS) return hit.rows;

  const rows = readTableRows(runs, group.providerCodes);
  rowsCache.set(key, { at: Date.now(), rows });
  rows.catch(() => rowsCache.delete(key));
  if (rowsCache.size > ROWS_CACHE_SIZE) rowsCache.delete(rowsCache.keys().next().value!);
  return rows;
}

export async function listFiles(user: SessionUser, submissionId: string) {
  const group = await findGroup(user, submissionId);
  const tables = [...group.runs.keys()].sort();
  const [counts, reviews] = await Promise.all([
    Promise.all(tables.map(async (table) => (await tableRows(group, table)).rows.length)),
    prisma.submissionReview.findMany({
      where: { submission_id: group.id },
      select: { table_name: true, status: true },
    }),
  ]);
  const reviewed = new Map(reviews.map((review) => [review.table_name, review.status]));

  return tables.map((table, index) => ({
    id: table,
    name: tableLabel(table),
    path: group.runs.get(table)!.map((run) => run.path).join(', '),
    rowCount: counts[index],
    review: reviewed.has(table) ? reviewed.get(table)!.toLowerCase() : undefined,
  }));
}

export async function getFileRows(user: SessionUser, submissionId: string, table: string) {
  const group = await findGroup(user, submissionId);
  const { columns, rows } = await tableRows(group, table);
  return {
    columns: columns.map((key) => ({ key, label: key.replace(/_/g, ' ') })),
    rows: rows.map((row, index) => ({
      rowId: rowIdOf(row) || String(index + 1),
      values: toCells(row, columns),
    })),
    total: rows.length,
  };
}

// ---------------------------------------------------------------------------------------------
// Reviews

/**
 * Records a DHET decision on one table. Every row must be either approved or rejected (with a
 * reason). Approved rows are written to the approved bucket before the decision is saved, so a
 * saved decision always has its rows in the bucket.
 */
export async function reviewFile(
  user: SessionUser,
  submissionId: string,
  table: string,
  { approvedRowIds, rejections }: ReviewBody,
) {
  const group = await findGroup(user, submissionId);
  const tableData = await tableRows(group, table);

  const existing = await prisma.submissionReview.findUnique({
    where: { submission_id_table_name: { submission_id: group.id, table_name: table } },
  });
  if (existing) throw new HttpError(409, 'This file has already been reviewed', { code: 'ALREADY_REVIEWED' });

  const rowsById = new Map(tableData.rows.map((row, index) => [rowIdOf(row) || String(index + 1), row]));
  const approved = new Set(approvedRowIds);
  const rejected = new Map(rejections.map(({ rowId, reason }) => [rowId, reason.trim()]));
  const decided = [...approved, ...rejected.keys()];
  if (
    decided.length !== rowsById.size ||
    approved.size !== approvedRowIds.length ||
    rejected.size !== rejections.length ||
    decided.some((rowId) => !rowsById.has(rowId)) ||
    [...approved].some((rowId) => rejected.has(rowId))
  ) {
    throw new HttpError(400, 'Every row must be either approved or rejected exactly once. Reload and try again.');
  }

  const id = randomUUID();
  const status: ReviewStatus = rejected.size > 0 ? 'REJECTED' : 'APPROVED';
  const reviewedAt = new Date();
  const approvedRows = tableData.rows.filter((row, index) => approved.has(rowIdOf(row) || String(index + 1)));

  let approvedKey: string | null = null;
  if (approvedRows.length > 0) {
    approvedKey = await writeApprovedRows(
      `college=${slug(group.college)}/table=${table}/ingest_date=${group.ingestDate}/review_id=${id}/`,
      tableData,
      approvedRows,
      {
        review_id: id,
        college: group.college,
        table,
        ingest_date: group.ingestDate,
        status: status.toLowerCase(),
        reviewer_id: user.id,
        reviewed_at: reviewedAt.toISOString(),
        approved_count: approvedRows.length,
        rejected_count: rejected.size,
        total_count: rowsById.size,
        source_runs: group.runs.get(table)!.map((run) => run.path),
      },
    );
  }

  await prisma.submissionReview.create({
    data: {
      id,
      submission_id: group.id,
      college: group.college,
      ingest_date: group.ingestDate,
      table_name: table,
      status,
      approved_count: approvedRows.length,
      total_count: rowsById.size,
      approved_key: approvedKey,
      reviewer_id: user.id,
      reviewed_at: reviewedAt,
      rejections: {
        create: [...rejected].map(([rowId, reason]) => ({
          row_id: rowId,
          reason,
          values: toCells(rowsById.get(rowId)!, tableData.columns),
        })),
      },
    },
  });
}

/** Decisions on a submission's tables, with the rejected rows, for the TVET overlay and history. */
export async function listReviews(user: SessionUser, submissionId: string) {
  const group = await findGroup(user, submissionId);
  const reviews = await prisma.submissionReview.findMany({
    where: { submission_id: group.id },
    include: { reviewer: { select: { full_name: true } }, rejections: true },
    orderBy: { reviewed_at: 'asc' },
  });

  return reviews.map((review) => {
    const firstValues = (review.rejections[0]?.values ?? {}) as Record<string, unknown>;
    return {
      fileId: review.table_name,
      tableName: tableLabel(review.table_name),
      reviewer: review.reviewer.full_name,
      reviewedAt: review.reviewed_at.toISOString(),
      status: review.status.toLowerCase(),
      approvedCount: review.approved_count,
      total: review.total_count,
      columns: Object.keys(firstValues).map((key) => ({ key, label: key.replace(/_/g, ' ') })),
      rejections: review.rejections.map((rejection) => ({
        rowId: rejection.row_id,
        reason: rejection.reason,
        values: rejection.values,
      })),
    };
  });
}
