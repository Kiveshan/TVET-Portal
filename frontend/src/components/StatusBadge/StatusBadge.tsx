import { cn } from '@/utils/classNames';
import styles from './StatusBadge.module.css';

export type SubmissionStatus = 'awaiting' | 'approved' | 'rejected';

const LABELS: Record<SubmissionStatus, string> = {
  awaiting: 'Awaiting Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

/** Colour-coded pill for a submission's review status. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return <span className={cn(styles.badge, styles[status], className)}>{LABELS[status]}</span>;
}
