import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Checkbox, DataTable, Icon, Modal, Toast } from '@/components';
import { useAsync } from '@/hooks/useAsync';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
import {
  getFileRows,
  getSubmission,
  listSubmissionFiles,
  submitFileReview,
} from '@/services/submissionService';
import type { ReviewSelectionState } from '@/types/submission';
import { cn } from '@/utils/classNames';
import { downloadTable, toColumns } from './fileTable';
import { BackToDataReview, FilePicker, SubmissionSummary } from './SubmissionSummary';
import styles from './SubmissionDetailPage.module.css';

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

  const [fileId, setFileId] = useState(returning?.fileId ?? '');
  const [selection, setSelection] = useState<Selection | null>(
    returning ? { fileId: returning.fileId, keys: new Set(returning.approvedRowIds) } : null,
  );
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // A file whose rows were all approved and submitted here (no rejection step needed).
  const [approvedFileId, setApprovedFileId] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const closeToast = useCallback(() => setToastOpen(false), []);

  const submission = useAsync(submissionId, () => getSubmission(submissionId));
  const files = useAsync(submissionId, () => listSubmissionFiles(submissionId));
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
  // Once submitted, the file's ticks and actions are locked.
  const locked = approvedFileId !== null && approvedFileId === fileId;

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
    try {
      await submitFileReview(submissionId, fileId, {
        approvedRowIds: [...selectedKeys],
        rejections: [],
      });
      setConfirming(false);
      setApprovedFileId(fileId);
      setToastOpen(true);
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
                  rows={rows.rows}
                  getRowKey={(row) => row.rowId}
                  selectedKeys={selectedKeys}
                  onSelectionChange={setSelectedKeys}
                  selectionHeader="Approve"
                  className={styles.rowsTable}
                />
                <p className={styles.selectionNote} aria-live="polite">
                  <Icon name="alert" size={13} />
                  {approvedCount}/{total} rows have been selected, {remaining} are remaining for
                  rejection
                </p>
              </>
            )}
          </Card>
        )}

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
            <p className={styles.muted}>No decisions recorded for this submission yet.</p>
          </Card>
        </section>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        ariaLabel="Confirm your selection"
        width={372}
        className={styles.confirmDialog}
      >
        <div className={styles.confirm}>
          <span className={styles.confirmIcon} aria-hidden="true">
            <Icon name="alert" size={34} strokeWidth={1.5} />
          </span>
          <h2 className={styles.confirmTitle}>Confirm Your Selection</h2>
          {allApproved ? (
            <p className={styles.confirmText}>
              You have selected all <strong>{approvedCount} rows</strong> for approval. No rows
              will be rejected, so the decision will be finalised now.
            </p>
          ) : (
            <p className={styles.confirmText}>
              You have selected <strong>{approvedCount} rows</strong> for approval. The remaining{' '}
              {remaining} <strong>rows</strong> will require rejection reasons before the decision
              can be finalised.
            </p>
          )}
          <p className={styles.confirmQuestion}>Do you want to continue?</p>
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
