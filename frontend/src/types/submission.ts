import type { SubmissionStatus } from '@/components/StatusBadge';

/** One college's data for one ingest date: its rows from every table that arrived that day. */
export interface Submission {
  id: string;
  /** ISO date (YYYY-MM-DD): the ingest date. */
  submittedOn: string;
  college: string;
  fileName: string;
  financialYear: string;
  status: SubmissionStatus;
  /** Tables in the submission, e.g. "staff_data". */
  tables: string[];
  /** The data feeds the rows came from (bucket `client=` prefix, e.g. "coltech"). */
  serviceProviders: string[];
}

/**
 * A table inside a submission. In the bucket each table is a folder of Parquet parts
 * (part-0000.parquet, part-0001.parquet, …); the backend joins the parts.
 */
export interface SubmissionFile {
  id: string;
  /** Readable table name shown in the dropdown. */
  name: string;
  /** Bucket path of the table's folder(s). */
  path: string;
  rowCount: number;
  /** Set once DHET has decided on this table; it can then no longer be reviewed. */
  review?: 'approved' | 'rejected';
}

/** A Parquet column as sent by the backend. */
export interface FileColumn {
  key: string;
  label: string;
}

/** Cell values arrive as JSON: decimals and timestamps as strings. */
export type FileCellValue = string | number | null;

/** One row of a table; `rowId` comes from the source table's RecId. */
export interface FileRow {
  rowId: string;
  values: Record<string, FileCellValue>;
}

export interface FileTable {
  columns: FileColumn[];
  rows: FileRow[];
  total: number;
}

export interface RowRejection {
  rowId: string;
  reason: string;
}

/** Rows kept vs rows rejected (each with a reason) for one table. */
export interface FileReviewDecision {
  approvedRowIds: string[];
  rejections: RowRejection[];
}

/** Router state carried between the selection and rejection steps. */
export interface ReviewSelectionState {
  fileId: string;
  approvedRowIds: string[];
}

export interface ReviewedRejection {
  rowId: string;
  values: Record<string, FileCellValue>;
  reason: string;
}

/** A DHET decision on one table of a submission. */
export interface SubmissionReview {
  /** The table (SubmissionFile id) the decision is about. */
  fileId: string;
  tableName: string;
  /** Name of the DHET user who submitted the decision. */
  reviewer: string;
  /** ISO timestamp. */
  reviewedAt: string;
  status: 'approved' | 'rejected';
  approvedCount: number;
  total: number;
  columns: FileColumn[];
  rejections: ReviewedRejection[];
}
