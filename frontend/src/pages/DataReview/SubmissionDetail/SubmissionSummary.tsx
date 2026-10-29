import { Button, Card, DetailTile, Dropdown, Icon, StatusBadge, TextLink } from '@/components';
import { PATHS } from '@/routes/paths';
import type { Submission, SubmissionFile } from '@/types/submission';
import { formatDate } from '@/utils/formatDate';
import styles from './SubmissionSummary.module.css';

const FILE_TYPES: Record<string, string> = {
  xlsx: 'Excel workbook (.xlsx)',
  csv: 'CSV file (.csv)',
  parquet: 'Parquet file (.parquet)',
};

function fileTypeOf(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return FILE_TYPES[extension] ?? extension.toUpperCase();
}

function datasetOf(fileName: string): string {
  if (fileName.includes('achievement')) return 'Achievement statistics';
  if (fileName.includes('campus')) return 'Campus / provider details';
  return 'Enrolment headcount statistics';
}

export function BackToDataReview() {
  return (
    <TextLink to={PATHS.dataReview} className={styles.back}>
      <Icon name="arrowLeft" size={14} />
      Back to Data Review
    </TextLink>
  );
}

export interface SubmissionSummaryProps {
  submission: Submission;
  /** Download is only possible once a file's rows are loaded. */
  onDownload?: () => void;
}

/** Top of the DHET submission pages: back link, college + status, Download File and file details. */
export function SubmissionSummary({ submission, onDownload }: SubmissionSummaryProps) {
  return (
    <>
      <BackToDataReview />

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{submission.college}</h1>
        <StatusBadge status={submission.status} />
      </div>

      <Button
        variant="accent"
        size="sm"
        className={styles.download}
        disabled={!onDownload}
        title={onDownload ? undefined : 'Select a file first'}
        onClick={onDownload}
      >
        Download File
      </Button>

      <Card className={styles.panel}>
        <dl className={styles.details}>
          <DetailTile label="File name" className={styles.detail}>
            {submission.fileName}
          </DetailTile>
          <DetailTile label="File type" className={styles.detail}>
            {fileTypeOf(submission.fileName)}
          </DetailTile>
          <DetailTile label="Financial year" className={styles.detail}>
            {submission.financialYear}
          </DetailTile>
          <DetailTile label="Submission date" className={styles.detail}>
            {formatDate(submission.submittedOn)}
          </DetailTile>
          <DetailTile label="Dataset" className={styles.detail}>
            {datasetOf(submission.fileName)}
          </DetailTile>
          <DetailTile label="Version" className={styles.detail}>
            {submission.status === 'resubmitted' ? 'v2 (resubmission)' : 'v1 (original)'}
          </DetailTile>
        </dl>
      </Card>
    </>
  );
}

export interface FilePickerProps {
  /** `undefined` while the list is loading. */
  files: SubmissionFile[] | undefined;
  value: string;
  onChange?: (fileId: string) => void;
  /** Locks the picker, e.g. on the rejection step. */
  disabled?: boolean;
}

/** "Data Preview" heading with the dropdown of tables in the submission. */
export function FilePicker({ files, value, onChange, disabled = false }: FilePickerProps) {
  return (
    <>
      <h2 id="data-preview" className={styles.sectionTitle}>
        Data Preview
      </h2>
      <p className={styles.sectionHint}>Sample of the uploaded records.</p>
      <Dropdown
        aria-labelledby="data-preview"
        placeholder={files ? 'File' : 'Loading files…'}
        options={(files ?? []).map((file) => ({
          value: file.id,
          label: `${file.name} (${file.rowCount} rows)`,
        }))}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled || !files}
        containerClassName={styles.filePicker}
      />
    </>
  );
}
