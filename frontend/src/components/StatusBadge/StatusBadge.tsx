import { cn } from '@/utils/classNames';
import styles from './StatusBadge.module.css';

export type SubmissionStatus = 'awaiting' | 'approved' | 'rejected';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'disabled';
export type BadgeStatus = SubmissionStatus | UserStatus;

const LABELS: Record<BadgeStatus, string> = {
  awaiting: 'Awaiting Approval',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  disabled: 'Disabled',
};

export interface StatusBadgeProps {
  status: BadgeStatus;
  /** `solid` = filled pill (submissions), `soft` = tinted pill (user accounts). */
  variant?: 'solid' | 'soft';
  className?: string;
}

/** Colour-coded pill for a review status. */
export function StatusBadge({ status, variant = 'solid', className }: StatusBadgeProps) {
  return (
    <span className={cn(styles.badge, styles[variant], styles[status], className)}>
      {LABELS[status]}
    </span>
  );
}
