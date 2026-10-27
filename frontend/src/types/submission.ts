import type { SubmissionStatus } from '@/components/StatusBadge';

export interface Submission {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  submittedOn: string;
  fileName: string;
  financialYear: string;
  status: SubmissionStatus;
}
