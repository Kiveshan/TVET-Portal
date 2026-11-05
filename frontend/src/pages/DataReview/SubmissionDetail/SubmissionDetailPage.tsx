import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Checkbox, DataTable, Icon, Modal, Pagination, Toast } from '@/components';
import { useAsync } from '@/hooks/useAsync';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
import { ApiError } from '@/services/apiClient';
import {
  getFileRows,
  getSubmission,
  listSubmissionFiles,
  listSubmissionReviews,
  submitFileReview,
} from '@/services/submissionService';
import type { ReviewSelectionState } from '@/types/submission';
import { cn } from '@/utils/classNames';
import { formatDateTime } from '@/utils/formatDate';
import { downloadTable, toColumns } from './fileTable';
import { BackToDataReview, FilePicker, SubmissionSummary } from './SubmissionSummary';
import styles from './SubmissionDetailPage.module.css';

/** "1 row" / "4 rows" */
const rowCount = (count: number) => `${count} ${count === 1 ? 'row' : 'rows'}`;

/** Tables can hold tens of thousands of rows, so only one page of them is drawn at a time. */
const ROW_PAGE_SIZE = 50;

/** Ticks belong to one file, so switching file starts with none ticked. */
interface Selection {
  fileId: string;
  keys: Set<string>;
}

export function SubmissionDetailPage() {
  const { submissionId = '' } = useParams();
  const navigate = useNavigate();
  // Coming back from the rejection step restores the file and ticks.
  const returning = useLocation().state as ReviewSelectionState | null;

  const [fileId, setFileIdState] = useState(returning?.fileId ?? '');
  const [rowPage, setRowPage] = useState(1);
  const setFileId = (id: string) => {
    setFileIdState(id);
    setRowPage(1);
  };
  const [selection, setSelection] = useState<Selection | null>(
    returning ? { fileId: returning.fileId, keys: new Set(returning.approvedRowIds) } : null,
  );
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // A file whose rows were all approved and submitted here (no rejection step needed).
  const [approvedFileId, setApprovedFileId] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const closeToast = useCallback(() => setToastOpen(false), []);
  // Bumped after a decision is saved, so status, files and history are fetched again.
  const [version, setVersion] = useState(0);

  const submission = useAsync(`${submissionId}|${version}`, () => getSubmission(submissionId), {
    keepPreviousData: true,
  });
  const files = useAsync(`${submissionId}|${version}`, () => listSubmissionFiles(submissionId), {
    keepPreviousData: true,
  });
  const reviews = useAsync(`${submissionId}|${version}`, () => listSubmissionReviews(submissionId), {
    keepPreviousData: true,
  });
  const table = useAsync(fileId ? `${submissionId}/${fileId}` : null, () =>
    getFileRows(submissionId, fileId),
  );

  if (submission.error) {
    return (
      <DashboardLayout>
        <BackToDataReview />
        <h1 className={styles.title}>Submission not found</h1>
        <p className={styles.muted}>It may have been removed, or the link is incorrect.</p>
      </DashboardLayout>
    );
  }

  if (!submission.data) {
    return (
      <DashboardLayout>
        <BackToDataReview />
        <p className={styles.muted}>Loading submission…</p>
      </DashboardLayout>
    );
  }

  const details = submission.data;
  const selectedFile = files.data?.find((file) => file.id === fileId);
  const rows = table.data;
  const selectedKeys = selection?.fileId === fileId ? selection.keys : new Set<string>();
  const total = rows?.total ?? 0;
  const approvedCount = selectedKeys.size;
  const remaining = total - approvedCount;
  const allApproved = total > 0 && remaining === 0;
  // A table DHET already decided on (here or earlier) is locked: its ticks and actions are disabled.
  const locked = Boolean(selectedFile?.review) || (approvedFileId !== null && approvedFileId === fileId);
  const rowPages = Math.max(Math.ceil(total / ROW_PAGE_SIZE), 1);
  const pageOfRows = rows?.rows.slice((rowPage - 1) * ROW_PAGE_SIZE, rowPage * ROW_PAGE_SIZE) ?? [];

  const setSelectedKeys = (keys: Set<string>) => {
    if (!locked) setSelection({ fileId, keys });
  };
  const toggleAll = (checked: boolean) =>
    setSelectedKeys(checked ? new Set(rows?.rows.map((row) => row.rowId)) : new Set());

  const goToRejection = () => {
    const state: ReviewSelectionState = { fileId, approvedRowIds: [...selectedKeys] };
    navigate(PATHS.dataReviewRejection(submissionId), { state });
  };

  // Every row approved: nothing to reject, so submit straight from here.
  const submitApproval = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitFileReview(submissionId, fileId, {
        approvedRowIds: [...selectedKeys],
        rejections: [],
      });
      setConfirming(false);
      setApprovedFileId(fileId);
      setToastOpen(true);
      setVersion((current) => current + 1);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setConfirming(false);
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <SubmissionSummary
        submission={details}
        onDownload={
          rows && selectedFile ? () => downloadTable(details, selectedFile.name, rows) : undefined
        }
      />

      <section className={styles.section} aria-labelledby="data-preview">
        <FilePicker files={files.data} value={fileId} onChange={setFileId} />

        {fileId && (
          <Card className={cn(styles.panel, styles.preview, locked && styles.locked)}>
            {table.loading && <p className={styles.muted}>Loading rows…</p>}
            {table.error && <p className={styles.error}>Could not load this file.</p>}
            {rows && (
              <>
                <Checkbox
                  label="Approve all rows"
                  checked={total > 0 && approvedCount === total}
                  indeterminate={approvedCount > 0 && approvedCount < total}
                  onChange={(e) => toggleAll(e.target.checked)}
                  disabled={locked}
                  className={styles.approveAll}
                />
                <DataTable
                  columns={toColumns(rows)}
                  rows={pageOfRows}
                  getRowKey={(row) => row.rowId}
                  selectedKeys={selectedKeys}
                  onSelectionChange={setSelectedKeys}
                  selectionHeader="Approve"
                  className={styles.rowsTable}
                />
                {rowPages > 1 && (
                  <Pagination page={rowPage} totalPages={rowPages} onPageChange={setRowPage} />
                )}
                <p className={styles.selectionNote} aria-live="polite">
                  <Icon name="alert" size={13} />
                  {selectedFile?.review
                    ? `This file has already been ${selectedFile.review}.`
                    : `${approvedCount}/${total} rows have been selected, ${remaining} ${
                        remaining === 1 ? 'is' : 'are'
                      } remaining for rejection`}
                </p>
              </>
            )}
          </Card>
        )}

        {submitError && <p className={styles.error}>{submitError}</p>}

        {rows && !locked && (
          <div className={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              icon="xCircle"
              disabled={approvedCount === 0}
              onClick={() => setSelectedKeys(new Set())}
            >
              Cancel
            </Button>
            <Button
              variant="navy"
              size="sm"
              icon="arrowRight"
              disabled={total === 0}
              onClick={() => setConfirming(true)}
            >
              {allApproved ? 'Continue' : 'Continue to Rejection'}
            </Button>
          </div>
        )}
      </section>

      {/* Hidden while a file's rows are on screen, so the review actions end the page. */}
      {!rows && (
        <section className={styles.section} aria-labelledby="review-history">
          <h2 id="review-history" className={styles.sectionTitle}>
            Review History
          </h2>
          <Card className={styles.panel}>
            {reviews.data && reviews.data.length > 0 ? (
              reviews.data.map((review) => (
                <p key={review.fileId} className={styles.muted}>
                  <strong>{review.tableName}</strong>: {review.status} by {review.reviewer} on{' '}
                  {formatDateTime(review.reviewedAt)} ({review.approvedCount}/{review.total} rows
                  approved)
                </p>
              ))
            ) : (
              <p className={styles.muted}>
                {reviews.data ? 'No decisions recorded for this submission yet.' : 'Loading…'}
              </p>
            )}
          </Card>
        </section>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        ariaLabel="Confirm your selection"
        width={372}
        showClose={false}
        className={styles.confirmDialog}
      >
        <div className={styles.confirm}>
          <span className={styles.confirmIcon} aria-hidden="true">
            <Icon name="alert" size={34} strokeWidth={1.5} />
          </span>
          <h2 className={styles.confirmTitle}>Confirm Your Selection</h2>
          {allApproved ? (
            <p className={styles.confirmText}>
              You have selected{' '}
              <strong>{approvedCount === 1 ? 'the only row' : `all ${rowCount(approvedCount)}`}</strong>{' '}
              for approval. No rows will be rejected, so the decision will be finalised now.
            </p>
          ) : (
            <p className={styles.confirmText}>
              You have selected <strong>{rowCount(approvedCount)}</strong> for approval. The
              remaining <strong>{rowCount(remaining)}</strong> will require rejection reasons before
              the decision can be finalised.
            </p>
          )}
          <div className={styles.confirmActions}>
            <Button
              variant="secondary"
              size="sm"
              className={styles.reviewButton}
              onClick={() => setConfirming(false)}
            >
              Review Selection
            </Button>
            {allApproved ? (
              <Button variant="navy" size="sm" loading={submitting} onClick={submitApproval}>
                Confirm and Submit
              </Button>
            ) : (
              <Button variant="navy" size="sm" onClick={goToRejection}>
                Continue to Rejections
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <Toast
        open={toastOpen}
        title="Approval Successful"
        message={`${approvedCount}/${total} rows have been approved successfully`}
        onClose={closeToast}
      />
    </DashboardLayout>
  );
}
