import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { cn } from '@/utils/classNames';
import { Icon } from '../Icon';
import styles from './Toast.module.css';

export interface ToastProps {
  open: boolean;
  title: string;
  message?: string;
  /** Auto-dismiss after this many ms. Defaults to 0: stays until the user dismisses it. */
  duration?: number;
  onClose: () => void;
}

/** Dragging further right than this dismisses the toast. */
const SWIPE_DISMISS_PX = 80;
/** Matches the slide-out animation in Toast.module.css. */
const LEAVE_MS = 200;

/**
 * Slides in at the top right and stays until dismissed with × or by swiping it to the right
 * (touch or mouse). It slides out when it closes.
 */
export function Toast({ open, ...props }: ToastProps) {
  // Mounted only while open, so each toast starts from a fresh slide-in.
  return open ? <ToastCard {...props} /> : null;
}

function ToastCard({ title, message, duration = 0, onClose }: Omit<ToastProps, 'open'>) {
  const [leaving, setLeaving] = useState(false);
  const [offset, setOffset] = useState(0);
  const dragStart = useRef<number | null>(null);

  const dismiss = () => setLeaving(true);

  useEffect(() => {
    if (duration === 0) return;
    const timer = window.setTimeout(() => setLeaving(true), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  // Close once the slide-out has played. A timer rather than animationend, which never
  // fires if animations are paused (e.g. a background tab).
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(onClose, LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, onClose]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    dragStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    // Only follows the pointer to the right (towards the screen edge).
    setOffset(Math.max(0, event.clientX - dragStart.current));
  };

  const onPointerEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (offset > SWIPE_DISMISS_PX) dismiss();
    else setOffset(0);
  };

  return (
    <div
      className={cn(styles.toast, leaving && styles.leaving, offset > 0 && styles.dragging)}
      role="status"
      aria-live="polite"
      style={offset > 0 && !leaving ? { transform: `translateX(${offset}px)` } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div className={styles.iconPanel}>
        <Icon name="check" size={30} strokeWidth={1.5} />
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
      </div>
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
