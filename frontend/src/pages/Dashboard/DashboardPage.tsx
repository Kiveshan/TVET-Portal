import { useState } from 'react';
import {
  DataTable,
  KpiCard,
  Pagination,
  StatusBadge,
  type DataTableColumn,
  type KpiTone,
  type SubmissionStatus,
} from '@/components';
import { SUBMISSIONS } from '@/constants/mockSubmissions';
import { useReviews } from '@/hooks/useReviews';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { statusAfterReview } from '@/services/reviewStore';
import type { Submission } from '@/types/submission';
import { formatDate } from '@/utils/formatDate';
import styles from './DashboardPage.module.css';

const PAGE_SIZE = 6;

const COLUMNS: DataTableColumn<Submission>[] = [
  {
    key: 'submittedOn',
    header: 'Submission Date',
    width: '20%',
    render: (row) => formatDate(row.submittedOn),
  },
  { key: 'fileName', header: 'File Name', width: '39%' },
  { key: 'financialYear', header: 'Financial Year', width: '19%', emphasis: true },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
];

type StatusFilter = SubmissionStatus | 'all';

interface KpiFilter {
  id: StatusFilter;
  label: string;
  tone: KpiTone;
}

/** Each card counts its status and, when clicked, filters the table to it. */
const KPI_FILTERS: KpiFilter[] = [
  { id: 'all', label: 'Total Submissions', tone: 'neutral' },
  { id: 'awaiting', label: 'Awaiting Approval', tone: 'pending' },
  { id: 'approved', label: 'Approved', tone: 'approved' },
  { id: 'rejected', label: 'Rejected', tone: 'rejected' },
];

const matches = (filter: StatusFilter) => (submission: Submission) =>
  filter === 'all' || submission.status === filter;

export function DashboardPage() {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const reviews = useReviews();
  // Counts and statuses reflect any DHET decision submitted since the data was loaded.
  const submissions = SUBMISSIONS.map((submission) => ({
    ...submission,
    status: statusAfterReview(submission, reviews),
  }));

  const filtered = submissions.filter(matches(activeFilter));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Clicking the active card again goes back to all submissions.
  const toggleFilter = (filter: StatusFilter) => {
    setActiveFilter((current) => (current === filter ? 'all' : filter));
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className={styles.heading}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Overview of TVET college data submissions in the DHET review cycle.
        </p>
      </div>

      <section className={styles.kpis} aria-label="Filter submissions by status">
        {KPI_FILTERS.map((filter) => (
          <KpiCard
            key={filter.id}
            value={submissions.filter(matches(filter.id)).length}
            label={filter.label}
            tone={filter.tone}
            selected={activeFilter === filter.id}
            onClick={() => toggleFilter(filter.id)}
          />
        ))}
      </section>

      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent Submissions</h2>
        <div className={styles.tableArea}>
          <DataTable
            columns={COLUMNS}
            rows={pageRows}
            getRowKey={(row) => row.id}
            emptyMessage="No submissions with this status."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </DashboardLayout>
  );
}
