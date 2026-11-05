import type {
  FileReviewDecision,
  FileTable,
  Submission,
  SubmissionFile,
  SubmissionReview,
} from '@/types/submission';
import { api } from './apiClient';

// Submissions come from the S3 ingestion bucket: one per college per ingest date.
// TVET users only get their own college's submissions; DHET gets every college.

const base = (submissionId: string) => `/submissions/${encodeURIComponent(submissionId)}`;
const fileBase = (submissionId: string, fileId: string) =>
  `${base(submissionId)}/files/${encodeURIComponent(fileId)}`;

/** Newest first, with each submission's review status. */
export async function listSubmissions(): Promise<Submission[]> {
  const { submissions } = await api<{ submissions: Submission[] }>('/submissions');
  return submissions;
}

export async function getSubmission(submissionId: string): Promise<Submission> {
  const { submission } = await api<{ submission: Submission }>(base(submissionId));
  return submission;
}

/** Tables in the submission (one entry per table, not per Parquet part). */
export async function listSubmissionFiles(submissionId: string): Promise<SubmissionFile[]> {
  const { files } = await api<{ files: SubmissionFile[] }>(`${base(submissionId)}/files`);
  return files;
}

/** Rows of one table for the submission's college, joined from its Parquet parts. */
export function getFileRows(submissionId: string, fileId: string): Promise<FileTable> {
  return api<FileTable>(`${fileBase(submissionId, fileId)}/rows`);
}

/** DHET decisions on the submission's tables, with rejected rows and their reasons. */
export async function listSubmissionReviews(submissionId: string): Promise<SubmissionReview[]> {
  const { reviews } = await api<{ reviews: SubmissionReview[] }>(`${base(submissionId)}/reviews`);
  return reviews;
}

/** DHET only. Approved rows are copied to the approved bucket; rejected rows keep their reasons. */
export async function submitFileReview(
  submissionId: string,
  fileId: string,
  decision: FileReviewDecision,
): Promise<void> {
  await api(`${fileBase(submissionId, fileId)}/review`, { method: 'POST', body: decision });
}
