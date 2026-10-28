import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Checkbox, DataTable, Icon, Modal } from '@/components';
import { useAsync } from '@/hooks/useAsync';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PATHS } from '@/routes/paths';
import { getFileRows, getSubmission, listSubmissionFiles } from '@/services/submissionService';
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

  const setSelectedKeys = (keys: Set<string>) => setSelection({ fileId, keys });
  const toggleAll = (checked: boolean) =>
    setSelectedKeys(checked ? new Set(rows?.rows.map((row) => row.rowId)) : new Set());

  const goToRejection = () => {
    const state: ReviewSelectionState = { fileId, approvedRowIds: [...selectedKeys] };
    navigate(PATHS.dataReviewRejection(submissionId), { state });
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
          <Card className={cn(styles.panel, styles.preview)}>
            {table.loading && <p className={styles.muted}>Loading rows…</p>}
            {table.error && <p className={styles.error}>Could not load this file.</p>}
            {rows && (
              <>
                <Checkbox
                  label="Approve all rows"
                  checked={total > 0 && approvedCount === total}
                  indeterminate={approvedCount > 0 && approvedCount < total}
                  onChange={(e) => toggleAll(e.target.checked)}
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

        {rows && (
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
              disabled={remaining === 0}
              onClick={() => setConfirming(true)}
            >
              Continue to Rejection
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
          <p className={styles.confirmText}>
            You have selected <strong>{approvedCount} rows</strong> for approval. The remaining{' '}
            {remaining} <strong>rows</strong> will require rejection reasons before the decision
            can be finalised.
          </p>
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
            <Button variant="navy" size="sm" onClick={goToRejection}>
              Continue to Rejections
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
