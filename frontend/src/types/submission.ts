import type { SubmissionStatus } from '@/components/StatusBadge';

export interface Submission {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  submittedOn: string;
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
