import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/utils/classNames';
import { Icon } from '../Icon';
import styles from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog (used when there is no visible title). */
  ariaLabel: string;
  /** Max width of the dialog in px. */
  width?: number;
  /** Hide the × when the dialog's own buttons already offer a way out (Esc still closes). */
  showClose?: boolean;
  className?: string;
  children: ReactNode;
}

/** General-purpose overlay built on the native <dialog>; closes on ×, Esc or backdrop click. */
export function Modal({
  open,
  onClose,
  ariaLabel,
  width = 1100,
  showClose = true,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(styles.dialog, className)}
      style={{ maxWidth: `min(${width}px, calc(100vw - 32px))` }}
      aria-label={ariaLabel}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clicking the backdrop closes the modal
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className={cn(styles.content, !showClose && styles.noClose)}>
        {showClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} strokeWidth={2} />
          </button>
        )}
        {open && children}
      </div>
    </dialog>
  );
}
