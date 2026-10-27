import { cn } from '@/utils/classNames';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Prev / "Page x of y" / Next pager. */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const pages = Math.max(totalPages, 1);

  return (
    <nav className={cn(styles.pagination, className)} aria-label="Pagination">
      <button
        type="button"
        className={styles.button}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      <span className={styles.status} aria-live="polite">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className={styles.button}
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
