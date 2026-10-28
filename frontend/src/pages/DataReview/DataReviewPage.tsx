import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  type SubmissionStatus,
} from '@/components';
import { getSubmissionRecords } from '@/constants/mockSubmissionRecords';
import { ALL_COLLEGE_SUBMISSIONS, SUBMISSIONS } from '@/constants/mockSubmissions';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
import type { Submission, SubmissionRecord } from '@/types/submission';
import { cn } from '@/utils/classNames';
import { downloadCsv } from '@/utils/downloadCsv';
import { formatDate } from '@/utils/formatDate';
import styles from './DataReviewPage.module.css';

const ALL = 'all';

type StatusFilter = SubmissionStatus | typeof ALL;

const STATUS_OPTIONS: DropdownOption[] = [
  { value: ALL, label: 'All statuses' },
  { value: 'awaiting', label: 'Awaiting Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

/** "All …" option followed by the distinct values found in the data. */
function buildOptions(values: string[], allLabel: string, descending = false): DropdownOption[] {
  const unique = [...new Set(values)].sort();
  if (descending) unique.reverse();
  return [{ value: ALL, label: allLabel }, ...unique.map((value) => ({ value, label: value }))];
}

const financialYearColumn: DataTableColumn<Submission> = {
  key: 'financialYear',
  header: 'Financial Year',
  width: '19%',
  emphasis: true,
};

const submissionDateColumn: DataTableColumn<Submission> = {
  key: 'submittedOn',
  header: 'Submission Date',
  width: '20%',
  render: (row) => formatDate(row.submittedOn),
};

const statusColumn: DataTableColumn<Submission> = {
  key: 'status',
  header: 'Status',
  render: (row) => <StatusBadge status={row.status} />,
};

interface ReviewView {
  title: string;
  submissions: Submission[];
  pageSize: number;
  /** DHET also filters by college and status. */
  extraFilters: boolean;
  sectionTitle?: string;
  columns: DataTableColumn<Submission>[];
}

/** TVET users see their own files; DHET users see every college. */
const TVET_VIEW: ReviewView = {
  title: 'Review',
  submissions: SUBMISSIONS,
  pageSize: 6,
  extraFilters: false,
  sectionTitle: 'Recent Submissions',
  columns: [
    { key: 'fileName', header: 'File Name', width: '40%' },
    financialYearColumn,
    submissionDateColumn,
    statusColumn,
  ],
};

const DHET_VIEW: ReviewView = {
  title: 'Data Review',
  submissions: ALL_COLLEGE_SUBMISSIONS,
  pageSize: 12,
  extraFilters: true,
  columns: [
    { key: 'college', header: 'College Name', width: '40%', emphasis: true },
    financialYearColumn,
    submissionDateColumn,
    statusColumn,
  ],
};

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const view = user?.role === 'DHET' ? DHET_VIEW : TVET_VIEW;
  const { submissions, pageSize, extraFilters } = view;

  const [college, setCollege] = useState(ALL);
  const [financialYear, setFinancialYear] = useState(ALL);
  const [status, setStatus] = useState<StatusFilter>(ALL);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Submission | null>(null);
  const selectedRecords = selected ? getSubmissionRecords(selected.id) : [];

  const collegeOptions = buildOptions(
    submissions.map((submission) => submission.college),
    'All colleges',
  );
  const yearOptions = buildOptions(
    submissions.map((submission) => submission.financialYear),
    'All years',
    true,
  );

  const filtered = submissions.filter(
    (submission) =>
      (college === ALL || submission.college === college) &&
      (financialYear === ALL || submission.financialYear === financialYear) &&
      (status === ALL || submission.status === status),
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const changeCollege = (value: string) => {
    setCollege(value);
    setPage(1);
  };

  const changeYear = (value: string) => {
    setFinancialYear(value);
    setPage(1);
  };

  const changeStatus = (value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  };

  // DHET opens a full review page; TVET previews the flagged rows in an overlay.
  const openSubmission = (submission: Submission) => {
    if (extraFilters) navigate(PATHS.dataReviewSubmission(submission.id));
    else setSelected(submission);
  };

  const clearFilters = () => {
    setCollege(ALL);
    setFinancialYear(ALL);
    setStatus(ALL);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className={styles.heading}>
        <h1 className={styles.title}>{view.title}</h1>
        <p className={styles.subtitle}>All submissions received from TVET colleges</p>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterGroup}>
          {extraFilters && (
            <Dropdown
              label="College"
              options={collegeOptions}
              value={college}
              onChange={(e) => changeCollege(e.target.value)}
              containerClassName={cn(styles.filterField, styles.collegeField)}
            />
          )}
          <Dropdown
            label="Financial Year"
            options={yearOptions}
            value={financialYear}
            onChange={(e) => changeYear(e.target.value)}
            containerClassName={cn(styles.filterField, styles.yearField)}
          />
          {extraFilters && (
            <Dropdown
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => changeStatus(e.target.value as StatusFilter)}
              containerClassName={cn(styles.filterField, styles.statusField)}
            />
          )}
        </div>
        <Button variant="secondary" size="sm" className={styles.clearButton} onClick={clearFilters}>
          Clear Filters
        </Button>
      </Card>

      <section className={styles.recent}>
        {view.sectionTitle && <h2 className={styles.sectionTitle}>{view.sectionTitle}</h2>}
        <div className={styles.tableArea}>
          <DataTable
            columns={view.columns}
            rows={pageRows}
            getRowKey={(row) => row.id}
            onRowClick={openSubmission}
            emptyMessage="No submissions match these filters."
            className={cn(extraFilters && styles.ruledTable)}
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
