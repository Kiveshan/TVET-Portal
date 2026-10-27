import type { Submission } from '@/types/submission';

// Mock data until the submissions API is available.
export const SUBMISSIONS: Submission[] = [
  { id: '1', submittedOn: '2026-10-16', fileName: 'orbit-enrolments-2026-27.xlsx', financialYear: '2026/27', status: 'awaiting' },
  { id: '2', submittedOn: '2026-10-16', fileName: 'majuba-enrolments-2026-27.xlsx', financialYear: '2026/27', status: 'awaiting' },
  { id: '3', submittedOn: '2026-10-16', fileName: 'umfolozi-achievement-q1-2026-27.parquet', financialYear: '2026/27', status: 'rejected' },
  { id: '4', submittedOn: '2026-10-16', fileName: 'falsebay-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: '5', submittedOn: '2026-10-09', fileName: 'cpt-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: '6', submittedOn: '2026-10-08', fileName: 'boland-achievement-q2-2025-26.parquet', financialYear: '2025/26', status: 'approved' },
  { id: '7', submittedOn: '2026-10-02', fileName: 'northlink-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'approved' },
  { id: '8', submittedOn: '2026-09-29', fileName: 'westcol-achievement-q1-2025-26.parquet', financialYear: '2025/26', status: 'awaiting' },
  { id: '9', submittedOn: '2026-09-24', fileName: 'ekurhuleni-east-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'approved' },
  { id: '10', submittedOn: '2026-09-18', fileName: 'tshwane-south-achievement-q2-2025-26.parquet', financialYear: '2025/26', status: 'rejected' },
  { id: '11', submittedOn: '2026-09-11', fileName: 'mnambithi-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: '12', submittedOn: '2026-09-03', fileName: 'esayidi-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'approved' },
];
