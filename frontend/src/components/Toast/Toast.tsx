import { useEffect } from 'react';
import { Icon } from '../Icon';
import styles from './Toast.module.css';

export interface ToastProps {
  open: boolean;
  title: string;
  message?: string;
  /** Auto-dismiss after this many ms. Pass 0 to keep it open. */
  duration?: number;
  onClose: () => void;
}

export function Toast({ open, title, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (!open || duration === 0) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <div className={styles.iconPanel}>
        <Icon name="check" size={30} strokeWidth={1.5} />
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
      </div>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Dismiss">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
