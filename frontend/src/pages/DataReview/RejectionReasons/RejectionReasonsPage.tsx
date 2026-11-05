import { useCallback, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  DataTable,
  Icon,
  Pagination,
  TextBox,
  Toast,
  type DataTableColumn,
} from '@/components';
import { useAsync } from '@/hooks/useAsync';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
import { ApiError } from '@/services/apiClient';
import {
  getFileRows,
  getSubmission,
  listSubmissionFiles,
  submitFileReview,
} from '@/services/submissionService';
import type { FileRow, ReviewSelectionState } from '@/types/submission';
import { cn } from '@/utils/classNames';
import { downloadTable, toColumns } from '../SubmissionDetail/fileTable';
import { FilePicker, SubmissionSummary } from '../SubmissionDetail/SubmissionSummary';
import styles from './RejectionReasonsPage.module.css';

/** Rows needing a reason can run into the thousands, so they are shown a page at a time. */
const ROW_PAGE_SIZE = 50;

export function RejectionReasonsPage() {
  const { submissionId = '' } = useParams();
  const navigate = useNavigate();
  const selection = useLocation().state as ReviewSelectionState | null;
  const fileId = selection?.fileId ?? '';

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rowPage, setRowPage] = useState(1);
  // Set once the decision is saved: the page locks and the success toast shows.
  const [result, setResult] = useState<{ approved: number; total: number } | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const closeToast = useCallback(() => setToastOpen(false), []);

  const submission = useAsync(submissionId, () => getSubmission(submissionId));
  const files = useAsync(submissionId, () => listSubmissionFiles(submissionId));
  const table = useAsync(fileId ? `${submissionId}/${fileId}` : null, () =>
    getFileRows(submissionId, fileId),
  );

  // Opened without choosing rows first (e.g. a pasted link): start at the selection step.
  if (!selection) return <Navigate to={PATHS.dataReviewSubmission(submissionId)} replace />;

  const approved = new Set(selection.approvedRowIds);
  const rows = table.data;
  const rejectedRows = rows?.rows.filter((row) => !approved.has(row.rowId)) ?? [];
  const reasonOf = (row: FileRow) => reasons[row.rowId]?.trim() ?? '';
  const filledCount = rejectedRows.filter((row) => reasonOf(row) !== '').length;
  const missingCount = rejectedRows.length - filledCount;
  const rowPages = Math.max(Math.ceil(rejectedRows.length / ROW_PAGE_SIZE), 1);
  const pageOfRows = rejectedRows.slice((rowPage - 1) * ROW_PAGE_SIZE, rowPage * ROW_PAGE_SIZE);
  const selectedFile = files.data?.find((file) => file.id === fileId);
  const details = submission.data;

  const reasonColumn: DataTableColumn<FileRow> = {
    key: 'rejectionReason',
    header: 'Rejection Reason',
    render: (row) => (
      <TextBox
        aria-label={`Rejection reason for row ${row.rowId}`}
        placeholder="Enter the Rejection Reason"
        value={reasons[row.rowId] ?? ''}
        onChange={(e) => setReasons((current) => ({ ...current, [row.rowId]: e.target.value }))}
        error={showErrors && reasonOf(row) === '' ? 'Required' : undefined}
        disabled={result !== null}
        containerClassName={styles.reasonField}
      />
    ),
  };

  const backToSelection = () =>
    navigate(PATHS.dataReviewSubmission(submissionId), { state: selection });

  const submit = async () => {
    if (missingCount > 0) {
      setShowErrors(true);
      // Jump to the first page with a missing reason.
      const firstMissing = rejectedRows.findIndex((row) => reasonOf(row) === '');
      setRowPage(Math.floor(firstMissing / ROW_PAGE_SIZE) + 1);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitFileReview(submissionId, fileId, {
        approvedRowIds: selection.approvedRowIds,
        rejections: rejectedRows.map((row) => ({ rowId: row.rowId, reason: reasonOf(row) })),
      });
      setResult({ approved: approved.size, total: rows?.total ?? 0 });
      setToastOpen(true);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      {details ? (
        <SubmissionSummary
          // A decision made here always rejects rows, which rejects the submission.
          submission={result ? { ...details, status: 'rejected' } : details}
          onDownload={
            rows && selectedFile ? () => downloadTable(details, selectedFile.name, rows) : undefined
          }
        />
      ) : (
        <p className={styles.muted}>Loading submission…</p>
      )}

      <section className={styles.section} aria-labelledby="data-preview">
        <FilePicker files={files.data} value={fileId} disabled />

        <Card className={styles.panel}>
          {table.loading && <p className={styles.muted}>Loading rows…</p>}
          {table.error && <p className={styles.error}>Could not load this file.</p>}
          {rows && (
            <>
              <DataTable
                columns={[...toColumns(rows), reasonColumn]}
                rows={pageOfRows}
                getRowKey={(row) => row.rowId}
                emptyMessage="All rows were approved; nothing to reject."
                className={styles.rowsTable}
              />
              {rowPages > 1 && (
                <Pagination page={rowPage} totalPages={rowPages} onPageChange={setRowPage} />
              )}
              {!result && (
                <p
                  className={cn(styles.progress, showErrors && missingCount > 0 && styles.missing)}
                  aria-live="polite"
                >
                  <Icon name="alert" size={13} />
                  {filledCount}/{rejectedRows.length} rejection reasons entered
                  {showErrors && missingCount > 0 && ` — ${missingCount} still required`}
                </p>
              )}
            </>
          )}
        </Card>

        {submitError && <p className={styles.error}>{submitError}</p>}

        {!result && (
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" icon="xCircle" onClick={backToSelection}>
              Back to Selection
            </Button>
            <Button
              variant="navy"
              size="sm"
              loading={submitting}
              disabled={!rows || rejectedRows.length === 0}
              onClick={submit}
            >
              Confirm and Submit
            </Button>
          </div>
        )}
      </section>

      <Toast
        open={toastOpen}
        title="Approval Successful"
        message={
          result
            ? `${result.approved}/${result.total} rows have been approved successfully`
            : undefined
        }
        onClose={closeToast}
      />
    </DashboardLayout>
  );
}
