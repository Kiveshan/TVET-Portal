import type { FileCellValue, Submission } from '@/types/submission';

// Mock bucket contents until the submissions API is available.
// Columns mirror the real Parquet exports; every value is invented (no real contact details).

interface MockTableBase {
  name: string;
  /** Folder name inside the submission's bucket folder. */
  folder: string;
}

/** Rows generated in code. */
export interface GeneratedTable extends MockTableBase {
  columns: string[];
  rows: Record<string, FileCellValue>[];
}

/** A real (anonymised) Parquet file served from /public/mock-bucket, read in the browser. */
export interface ParquetTable extends MockTableBase {
  parquetUrl: string;
}

export type MockTable = GeneratedTable | ParquetTable;

/** Submission whose campus table comes from the anonymised Parquet sample. */
export const PARQUET_SAMPLE_SUBMISSION_ID = 'dhet-19';

const CAMPUS_COLUMNS = [
  'RecId',
  'PROVIDER_CODE',
  'College name',
  'Campus name',
  'Provider_Postal_Address_1',
  'Provider_Postal_Address_2',
  'Provider_Postal_Address_3',
  'Provider_Postal_Address_Code',
  'Provider_Physical_Address_1',
  'Provider_Physical_Address_2',
  'Provider_Physical_Address_3',
  'Provider_Physical_Address_Code',
  'Latitude_Degree',
  'Latitude_Minutes',
  'Latitude_Seconds',
  'Longitude_Degree',
  'Longitude_Minutes',
  'Longitude_Seconds',
  'Municipality',
  'Provider_Phone_Number',
  'Provider_Contact_Email_Address',
  'Provider_Contact_Cell_Number',
  'Provider_Status_Id',
  'Contact person',
  'Province_Code',
  'MIS_Type_Id',
  'Number of hostels for each campus',
  'LAST_BINARY_CHECK',
  'DATE_SYNCED',
];

const CAMPUSES = ['Central Office', 'City Campus', 'North Campus', 'Riverside Campus', 'City Campus'];
const CONTACTS = ['A. MOKOENA', 'T. NKOSI', 'L. VAN WYK', 'S. PILLAY', 'R. DLAMINI'];
const TOWNS = ['TOWNVILLE', 'TOWNVILLE', 'RIVERTON', 'RIVERTON', 'TOWNVILLE'];

function slug(college: string): string {
  return college
    .replace(/ (TVET )?(College|Institute)$/i, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '');
}

function campusTable(college: string): GeneratedTable {
  const domain = `${slug(college)}.example.org`;
  const rows = CAMPUSES.map((campus, index) => {
    // The last row repeats a campus with impossible coordinates: the kind of row a reviewer rejects.
    const isFaulty = index === CAMPUSES.length - 1;
    const code = index === 0 ? '304' : `39999${5300 + (isFaulty ? 1 : index)}`;
    return {
      RecId: 26 + index,
      PROVIDER_CODE: code,
      'College name': college,
      'Campus name': `${college} - ${campus}`,
      Provider_Postal_Address_1: `PRIVATE BAG X ${2000 + index * 7}`,
      Provider_Postal_Address_2: `PRIVATE BAG X ${2000 + index * 7}`,
      Provider_Postal_Address_3: TOWNS[index],
      Provider_Postal_Address_Code: index < 2 ? '1947' : '9500',
      Provider_Physical_Address_1: `${12 + index * 9} MAIN STREET`,
      Provider_Physical_Address_2: `${12 + index * 9} MAIN STREET`,
      Provider_Physical_Address_3: TOWNS[index],
      Provider_Physical_Address_Code: index < 2 ? '1947' : '9500',
      Latitude_Degree: isFaulty ? -40 : -26 - (index % 2),
      Latitude_Minutes: 30 + index * 3,
      Latitude_Seconds: (3.725 + index * 7.1).toFixed(3),
      Longitude_Degree: isFaulty ? 74 : 27,
      Longitude_Minutes: 10 + index * 10,
      Longitude_Seconds: (12.152 + index * 6.3).toFixed(3),
      Municipality: null,
      Provider_Phone_Number: `011 555 01${10 + index}`,
      Provider_Contact_Email_Address: `contact${index + 1}@${domain}`,
      Provider_Contact_Cell_Number: `011 555 01${10 + index}`,
      Provider_Status_Id: 1,
      'Contact person': CONTACTS[index],
      Province_Code: 4,
      MIS_Type_Id: 2,
      'Number of hostels for each campus': index === 0 ? 0 : 150 + index * 15,
      LAST_BINARY_CHECK: 835366287 - index * 412_773_103,
      DATE_SYNCED: '2026-10-05T16:00:40.047',
    };
  });
  return { name: 'Campus / provider details', folder: 'campus_provider', columns: CAMPUS_COLUMNS, rows };
}

const PROGRAMMES: [code: string, name: string][] = [
  ['NCV-EL2', 'NC(V) Level 2 Electrical Infrastructure Construction'],
  ['NCV-FA2', 'NC(V) Level 2 Finance, Economics and Accounting'],
  ['NCV-IT2', 'NC(V) Level 2 Information Technology & Computer Science'],
  ['NCV-OM3', 'NC(V) Level 3 Office Management'],
  ['NCV-CE4', 'NC(V) Level 4 Civil Engineering and Building Construction'],
  ['R191-BM4', 'Report 191 Business Management N4'],
  ['R191-ED4', 'Report 191 Educare N4'],
  ['R191-HR5', 'Report 191 Human Resource Management N5'],
  ['R191-FM6', 'Report 191 Financial Management N6'],
  ['OCP-EL4', 'Occupational: Electrician NQF Level 4'],
];

const ENROLMENT_COLUMNS = [
  'RecId',
  'Programme code',
  'Programme name',
  'Campus name',
  'Full-time headcount',
  'Part-time headcount',
];

/** 200 rows: every programme at every campus, across two intakes. */
function enrolmentTable(college: string): GeneratedTable {
  const campuses = CAMPUSES.slice(1, 4);
  const rows: Record<string, FileCellValue>[] = [];
  for (let i = 0; i < 200; i += 1) {
    const [code, name] = PROGRAMMES[i % PROGRAMMES.length];
    const campus = campuses[Math.floor(i / PROGRAMMES.length) % campuses.length];
    rows.push({
      RecId: i + 1,
      'Programme code': code,
      'Programme name': name,
      'Campus name': `${college} - ${campus}`,
      'Full-time headcount': 2436 + ((i * 137) % 900),
      'Part-time headcount': 40 + ((i * 23) % 120),
    });
  }
  return { name: 'Programme enrolments', folder: 'programme_enrolments', columns: ENROLMENT_COLUMNS, rows };
}

/** The tables stored for a submission, as they would sit in the bucket. */
export function getMockTables(submission: Submission): MockTable[] {
  if (submission.id === PARQUET_SAMPLE_SUBMISSION_ID) {
    const folder = 'campus_provider';
    return [
      {
        name: 'Campus / provider details',
        folder,
        parquetUrl: `/mock-bucket/${bucketFolder(submission)}/${folder}/part-0000.parquet`,
      },
      enrolmentTable(submission.college),
    ];
  }
  return [campusTable(submission.college), enrolmentTable(submission.college)];
}

/** e.g. "falsebay-enrolments-2025-26.xlsx" -> "submissions/falsebay-enrolments-2025-26" */
export function bucketFolder(submission: Submission): string {
  return `submissions/${submission.fileName.replace(/\.[^.]+$/, '')}`;
}
