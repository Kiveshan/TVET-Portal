import type { SubmissionStatus } from '@/components/StatusBadge';

export interface Submission {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  submittedOn: string;
  college: string;
  fileName: string;
  financialYear: string;
  status: SubmissionStatus;
}

/** One row inside a submitted file, as shown in the Data Review details overlay. */
export interface SubmissionRecord {
  rowNumber: number;
  programmeCode: string;
  programmeName: string;
  fullTimeHeadcount: number;
  partTimeHeadcount: number;
  rejectedBy: string;
  reason: string;
}

/**
 * A table inside a submission. In the bucket each table is a folder of Parquet parts
 * (part-0000.parquet, part-0001.parquet, …); the backend joins the parts.
 */
export interface SubmissionFile {
  id: string;
  /** Readable table name shown in the dropdown. */
  name: string;
  /** Bucket path of the table's folder. */
  path: string;
  rowCount: number;
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
