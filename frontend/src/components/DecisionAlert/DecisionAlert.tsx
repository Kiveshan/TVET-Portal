import { useEffect } from 'react';
import { cn } from '@/utils/classNames';
import { Icon } from '../Icon';
import styles from './DecisionAlert.module.css';

export type Decision = 'approved' | 'rejected';

const DEFAULT_MESSAGES: Record<Decision, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
};

export interface DecisionAlertProps {
  /** Which popup to show; `null` hides it. */
  decision: Decision | null;
  /** Overrides the default "Approved" / "Rejected" text. */
  message?: string;
  /** Auto-dismiss after this many ms. Pass 0 to keep it open. */
  duration?: number;
  onClose: () => void;
}

/** Green "Approved" / red "Rejected" popup shown after a System Admin decision. */
export function DecisionAlert({ decision, message, duration = 4000, onClose }: DecisionAlertProps) {
  useEffect(() => {
    if (!decision || duration === 0) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [decision, duration, onClose]);

  if (!decision) return null;

  return (
    <div className={cn(styles.alert, styles[decision])} role="status" aria-live="polite">
      <Icon name="check" size={24} strokeWidth={1.75} className={styles.icon} />
      <p className={styles.message}>{message ?? DEFAULT_MESSAGES[decision]}</p>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Dismiss">
        <Icon name="close" size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
