import { useCallback, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, DataTable, Icon, TextBox, Toast, type DataTableColumn } from '@/components';
import { useAsync } from '@/hooks/useAsync';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
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

export function RejectionReasonsPage() {
  const { submissionId = '' } = useParams();
  const navigate = useNavigate();
  const selection = useLocation().state as ReviewSelectionState | null;
  const fileId = selection?.fileId ?? '';

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      return;
    }
    setSubmitting(true);
    try {
      await submitFileReview(submissionId, fileId, {
        approvedRowIds: selection.approvedRowIds,
        rejections: rejectedRows.map((row) => ({ rowId: row.rowId, reason: reasonOf(row) })),
      });
      setResult({ approved: approved.size, total: rows?.total ?? 0 });
      setToastOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      {details ? (
        <SubmissionSummary
          submission={details}
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
                rows={rejectedRows}
                getRowKey={(row) => row.rowId}
                emptyMessage="All rows were approved; nothing to reject."
                className={styles.rowsTable}
              />
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
