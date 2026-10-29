import type { Submission } from '@/types/submission';

// Mock data until the submissions API is available.

/** Submissions shown to TVET users. */
export const SUBMISSIONS: Submission[] = [
  { id: '1', submittedOn: '2026-10-16', college: 'Orbit TVET College', fileName: 'orbit-enrolments-2026-27.xlsx', financialYear: '2026/27', status: 'awaiting' },
  { id: '2', submittedOn: '2026-10-16', college: 'Majuba TVET College', fileName: 'majuba-enrolments-2026-27.xlsx', financialYear: '2026/27', status: 'awaiting' },
  { id: '3', submittedOn: '2026-10-16', college: 'Umfolozi TVET College', fileName: 'umfolozi-achievement-q1-2026-27.parquet', financialYear: '2026/27', status: 'rejected' },
  { id: '4', submittedOn: '2026-10-16', college: 'False Bay TVET College', fileName: 'falsebay-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: '5', submittedOn: '2026-10-09', college: 'College of Cape Town', fileName: 'cpt-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: '6', submittedOn: '2026-10-08', college: 'Boland TVET College', fileName: 'boland-achievement-q2-2025-26.parquet', financialYear: '2025/26', status: 'approved' },
  { id: '7', submittedOn: '2026-10-02', college: 'Northlink TVET College', fileName: 'northlink-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'approved' },
  { id: '8', submittedOn: '2026-09-29', college: 'Western College TVET', fileName: 'westcol-achievement-q1-2025-26.parquet', financialYear: '2025/26', status: 'awaiting' },
  { id: '9', submittedOn: '2026-09-24', college: 'Ekurhuleni East TVET College', fileName: 'ekurhuleni-east-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'approved' },
  { id: '10', submittedOn: '2026-09-18', college: 'Tshwane South TVET College', fileName: 'tshwane-south-achievement-q2-2025-26.parquet', financialYear: '2025/26', status: 'rejected' },
  { id: '11', submittedOn: '2026-09-11', college: 'Mnambithi TVET College', fileName: 'mnambithi-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: '12', submittedOn: '2026-09-03', college: 'Esayidi TVET College', fileName: 'esayidi-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'approved' },
];

/** Submissions from every college, shown to DHET users. */
export const ALL_COLLEGE_SUBMISSIONS: Submission[] = [
  // Backed by the anonymised Parquet sample in public/mock-bucket.
  { id: 'dhet-19', submittedOn: '2026-10-17', college: 'Flavius Mareka TVET College', fileName: 'flaviusmareka-campus-2026-27.parquet', financialYear: '2026/27', status: 'awaiting' },
  // Sent in again after the earlier version was rejected (see dhet-3 and dhet-14).
  { id: 'dhet-20', submittedOn: '2026-10-21', college: 'Northlink TVET College', fileName: 'northlink-enrolments-2025-26-v2.xlsx', financialYear: '2025/26', status: 'resubmitted' },
  { id: 'dhet-21', submittedOn: '2026-10-19', college: 'Esayidi TVET College', fileName: 'esayidi-enrolments-2024-25-v2.xlsx', financialYear: '2024/25', status: 'resubmitted' },
  { id: 'dhet-1', submittedOn: '2026-10-12', college: 'False Bay TVET College', fileName: 'falsebay-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: 'dhet-2', submittedOn: '2026-10-08', college: 'Boland TVET College', fileName: 'boland-achievement-q2-2025-26.parquet', financialYear: '2025/26', status: 'approved' },
  { id: 'dhet-3', submittedOn: '2026-10-05', college: 'Northlink TVET College', fileName: 'northlink-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'rejected' },
  { id: 'dhet-4', submittedOn: '2026-09-30', college: 'Ekurhuleni West TVET College', fileName: 'ekurhuleni-west-enrolments-2024-25.xlsx', financialYear: '2024/25', status: 'awaiting' },
  { id: 'dhet-5', submittedOn: '2026-09-22', college: 'Tshwane South TVET College', fileName: 'tshwane-south-achievement-q4-2024-25.parquet', financialYear: '2024/25', status: 'approved' },
  { id: 'dhet-6', submittedOn: '2026-10-15', college: 'Majuba TVET College', fileName: 'majuba-enrolments-2026-27.xlsx', financialYear: '2026/27', status: 'awaiting' },
  { id: 'dhet-7', submittedOn: '2026-10-14', college: 'Umfolozi TVET College', fileName: 'umfolozi-achievement-q1-2026-27.parquet', financialYear: '2026/27', status: 'rejected' },
  { id: 'dhet-8', submittedOn: '2026-09-18', college: 'Maluti-a-Phofung TVET Institute', fileName: 'maluti-enrolments-2024-25.xlsx', financialYear: '2024/25', status: 'approved' },
  { id: 'dhet-9', submittedOn: '2026-10-16', college: 'Orbit TVET College', fileName: 'orbit-enrolments-2026-27.xlsx', financialYear: '2026/27', status: 'awaiting' },
  { id: 'dhet-10', submittedOn: '2026-10-02', college: 'West Coast TVET College', fileName: 'westcoast-achievement-q2-2025-26.parquet', financialYear: '2025/26', status: 'approved' },
  { id: 'dhet-11', submittedOn: '2026-10-09', college: 'College of Cape Town', fileName: 'cpt-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: 'dhet-12', submittedOn: '2026-09-28', college: 'Sekhukhune South TVET College', fileName: 'sekhukhune-enrolments-2024-25.xlsx', financialYear: '2024/25', status: 'awaiting' },
  { id: 'dhet-13', submittedOn: '2026-09-25', college: 'Mnambithi TVET College', fileName: 'mnambithi-achievement-q1-2025-26.parquet', financialYear: '2025/26', status: 'approved' },
  { id: 'dhet-14', submittedOn: '2026-09-20', college: 'Esayidi TVET College', fileName: 'esayidi-enrolments-2024-25.xlsx', financialYear: '2024/25', status: 'rejected' },
  { id: 'dhet-15', submittedOn: '2026-09-16', college: 'Lovedale TVET College', fileName: 'lovedale-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: 'dhet-16', submittedOn: '2026-09-12', college: 'Vhembe TVET College', fileName: 'vhembe-achievement-q3-2024-25.parquet', financialYear: '2024/25', status: 'approved' },
  { id: 'dhet-17', submittedOn: '2026-09-09', college: 'Capricorn TVET College', fileName: 'capricorn-enrolments-2025-26.xlsx', financialYear: '2025/26', status: 'awaiting' },
  { id: 'dhet-18', submittedOn: '2026-09-04', college: 'Motheo TVET College', fileName: 'motheo-enrolments-2024-25.xlsx', financialYear: '2024/25', status: 'approved' },
];
