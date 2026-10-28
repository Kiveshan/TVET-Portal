import { bucketFolder, getMockTables, type MockTable } from '@/constants/mockSubmissionFiles';
import { ALL_COLLEGE_SUBMISSIONS, SUBMISSIONS } from '@/constants/mockSubmissions';
import type {
  FileReviewDecision,
  FileTable,
  Submission,
  SubmissionFile,
} from '@/types/submission';
import { readParquet, readParquetRowCount, type ParquetContents } from './parquetReader';

// Frontend-only stubs. Replace with real API calls once the backend exists:
//   GET  /submissions/:id
//   GET  /submissions/:id/files
//   GET  /submissions/:id/files/:fileId/rows
//   POST /submissions/:id/files/:fileId/review

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

function findSubmission(submissionId: string): Submission {
  const submission = [...ALL_COLLEGE_SUBMISSIONS, ...SUBMISSIONS].find(
    (candidate) => candidate.id === submissionId,
  );
  if (!submission) throw new NotFoundError('Submission');
  return submission;
}

/** "Provider_Postal_Address_1" -> "Provider Postal Address 1" */
function toLabel(column: string): string {
  return column.replace(/_/g, ' ');
}

/** Columns + rows of a mock table, decoding the Parquet file when there is one. */
function loadTable(table: MockTable): Promise<ParquetContents> {
  if ('parquetUrl' in table) return readParquet(table.parquetUrl);
  return Promise.resolve({ columns: table.columns, rows: table.rows });
}

export async function getSubmission(submissionId: string): Promise<Submission> {
  await delay(200);
  return findSubmission(submissionId);
}

/** Tables in the submission's bucket folder (one entry per table, not per Parquet part). */
export async function listSubmissionFiles(submissionId: string): Promise<SubmissionFile[]> {
  await delay(300);
  const submission = findSubmission(submissionId);
  return Promise.all(
    getMockTables(submission).map(async (table) => ({
      id: table.folder,
      name: table.name,
      path: `${bucketFolder(submission)}/${table.folder}/`,
      rowCount:
        'parquetUrl' in table ? await readParquetRowCount(table.parquetUrl) : table.rows.length,
    })),
  );
}

/** Rows of one table, already joined from its Parquet parts and converted to JSON. */
export async function getFileRows(submissionId: string, fileId: string): Promise<FileTable> {
  await delay(500);
  const table = getMockTables(findSubmission(submissionId)).find((t) => t.folder === fileId);
  if (!table) throw new NotFoundError('File');
  const { columns, rows } = await loadTable(table);
  return {
    columns: columns.map((key) => ({ key, label: toLabel(key) })),
    rows: rows.map((values, index) => ({ rowId: String(values.RecId ?? index + 1), values })),
    total: rows.length,
  };
}

export async function submitFileReview(
  submissionId: string,
  fileId: string,
  decision: FileReviewDecision,
): Promise<void> {
  await delay(500);
  console.info('[submissionService] review', submissionId, fileId, {
    approved: decision.approvedRowIds.length,
    rejected: decision.rejections.length,
  });
}
