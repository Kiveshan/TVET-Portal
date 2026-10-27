import { useState } from 'react';
import {
  Button,
  Card,
  DataTable,
  Dropdown,
  Modal,
  Pagination,
  StatusBadge,
  type DataTableColumn,
  type DropdownOption,
} from '@/components';
import { getSubmissionRecords } from '@/constants/mockSubmissionRecords';
import { SUBMISSIONS } from '@/constants/mockSubmissions';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Submission, SubmissionRecord } from '@/types/submission';
import { downloadCsv } from '@/utils/downloadCsv';
import { formatDate } from '@/utils/formatDate';
import styles from './DataReviewPage.module.css';

const PAGE_SIZE = 6;
const ALL_YEARS = 'all';

const YEAR_OPTIONS: DropdownOption[] = [
  { value: ALL_YEARS, label: 'All years' },
  ...[...new Set(SUBMISSIONS.map((submission) => submission.financialYear))]
    .sort()
    .reverse()
    .map((year) => ({ value: year, label: year })),
];

const COLUMNS: DataTableColumn<Submission>[] = [
  { key: 'fileName', header: 'File Name', width: '40%' },
  { key: 'financialYear', header: 'Financial Year', width: '19%', emphasis: true },
  {
    key: 'submittedOn',
    header: 'Submission Date',
    width: '20%',
    render: (row) => formatDate(row.submittedOn),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
];

const headcountFormatter = new Intl.NumberFormat('en-ZA');

const RECORD_COLUMNS: DataTableColumn<SubmissionRecord>[] = [
  { key: 'rowNumber', header: 'Row Number' },
  { key: 'programmeCode', header: 'Programme Code' },
  { key: 'programmeName', header: 'Programme Name', emphasis: true },
  {
    key: 'fullTimeHeadcount',
    header: 'Full-Time Headcount',
    emphasis: true,
    render: (row) => headcountFormatter.format(row.fullTimeHeadcount),
  },
  { key: 'partTimeHeadcount', header: 'Part-Time Headcount', emphasis: true },
  { key: 'rejectedBy', header: 'Rejected By' },
  { key: 'reason', header: 'Reason' },
];

function downloadRecords(submission: Submission, records: SubmissionRecord[]) {
  const baseName = submission.fileName.replace(/\.[^.]+$/, '');
  downloadCsv(
    `${baseName}-review.csv`,
    RECORD_COLUMNS.map((column) => column.header),
    records.map((record) =>
      RECORD_COLUMNS.map((column) => record[column.key as keyof SubmissionRecord]),
    ),
  );
}

export function DataReviewPage() {
  const [financialYear, setFinancialYear] = useState(ALL_YEARS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Submission | null>(null);
  const selectedRecords = selected ? getSubmissionRecords(selected.id) : [];

  const filtered =
    financialYear === ALL_YEARS
      ? SUBMISSIONS
      : SUBMISSIONS.filter((submission) => submission.financialYear === financialYear);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeYear = (year: string) => {
    setFinancialYear(year);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className={styles.heading}>
        <h1 className={styles.title}>Review</h1>
        <p className={styles.subtitle}>All submissions received from TVET colleges</p>
      </div>

      <Card className={styles.filters}>
        <Dropdown
          label="Financial Year"
          options={YEAR_OPTIONS}
          value={financialYear}
          onChange={(e) => changeYear(e.target.value)}
          containerClassName={styles.yearField}
        />
        <Button
          variant="secondary"
          size="sm"
          className={styles.clearButton}
          onClick={() => changeYear(ALL_YEARS)}
        >
          Clear Filters
        </Button>
      </Card>

      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent Submissions</h2>
        <div className={styles.tableArea}>
          <DataTable
            columns={COLUMNS}
            rows={pageRows}
            getRowKey={(row) => row.id}
            onRowClick={setSelected}
            emptyMessage="No submissions for this financial year."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        ariaLabel={selected ? `Details for ${selected.fileName}` : 'Submission details'}
      >
        {selected && (
          <div className={styles.details}>
            <Button
              variant="accent"
              size="sm"
              className={styles.downloadButton}
              onClick={() => downloadRecords(selected, selectedRecords)}
            >
              Download File
            </Button>
            <DataTable
              columns={RECORD_COLUMNS}
              rows={selectedRecords}
              getRowKey={(row) => String(row.rowNumber)}
              className={styles.recordsTable}
            />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
