import { useState } from 'react';
import {
  DataTable,
  KpiCard,
  Pagination,
  StatusBadge,
  type DataTableColumn,
} from '@/components';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Submission } from '@/types/submission';
import { SUBMISSIONS } from './dashboardData';
import styles from './DashboardPage.module.css';

const PAGE_SIZE = 6;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-10-09' -> '9 Oct 2026' */
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

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

export function DashboardPage() {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(SUBMISSIONS.length / PAGE_SIZE);
  const pageRows = SUBMISSIONS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const countBy = (status: Submission['status']) =>
    SUBMISSIONS.filter((submission) => submission.status === status).length;

  return (
    <DashboardLayout>
      <div className={styles.heading}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Overview of TVET college data submissions in the DHET review cycle.
        </p>
      </div>

      <section className={styles.kpis} aria-label="Submission summary">
        <KpiCard value={SUBMISSIONS.length} label="Total Submissions" />
        <KpiCard value={countBy('awaiting')} label="Awaiting Approval" tone="pending" />
        <KpiCard value={countBy('approved')} label="Approved" tone="approved" />
        <KpiCard value={countBy('rejected')} label="Rejected" tone="rejected" />
      </section>

      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent Submissions</h2>
        <div className={styles.tableArea}>
          <DataTable columns={COLUMNS} rows={pageRows} getRowKey={(row) => row.id} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </DashboardLayout>
  );
}
