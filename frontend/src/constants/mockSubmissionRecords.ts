import type { SubmissionRecord } from '@/types/submission';

// Mock data until the submission details API is available.
const RECORDS: SubmissionRecord[] = [
  { rowNumber: 65, programmeCode: 'NCV-EL2', programmeName: 'NC(V) Level 2 Electrical Infrastructure Construction', fullTimeHeadcount: 2436, partTimeHeadcount: 40, rejectedBy: 'System', reason: 'Invalid ID' },
  { rowNumber: 76, programmeCode: 'NCV-FA2', programmeName: 'NC(V) Level 2 Finance, Economics and Accounting', fullTimeHeadcount: 2573, partTimeHeadcount: 63, rejectedBy: 'System', reason: 'Null fields' },
  { rowNumber: 80, programmeCode: 'NCV-IT2', programmeName: 'NC(V) Level 2 Information Technology & Computer Science', fullTimeHeadcount: 2710, partTimeHeadcount: 86, rejectedBy: 'DHET (Nomsa Dlamini, 27/10/2026, 17:30)', reason: 'Invalid ID' },
  { rowNumber: 9, programmeCode: 'R191-BM4', programmeName: 'Report 191 Business Management N4', fullTimeHeadcount: 2847, partTimeHeadcount: 109, rejectedBy: 'System', reason: 'Invalid ID' },
  { rowNumber: 53, programmeCode: 'R191-ED4', programmeName: 'Report 191 Educare N4', fullTimeHeadcount: 2984, partTimeHeadcount: 132, rejectedBy: 'System', reason: 'Invalid ID' },
  { rowNumber: 112, programmeCode: 'R191-HR5', programmeName: 'Report 191 Human Resource Management N5', fullTimeHeadcount: 1920, partTimeHeadcount: 74, rejectedBy: 'System', reason: 'Duplicate row' },
  { rowNumber: 131, programmeCode: 'NCV-OM3', programmeName: 'NC(V) Level 3 Office Management', fullTimeHeadcount: 1755, partTimeHeadcount: 28, rejectedBy: 'System', reason: 'Null fields' },
];

/** Returns the flagged rows for a submission (the same sample set for now). */
export function getSubmissionRecords(submissionId: string): SubmissionRecord[] {
  void submissionId;
  return RECORDS;
}
