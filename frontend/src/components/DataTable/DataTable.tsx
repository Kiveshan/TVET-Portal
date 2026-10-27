import type { ReactNode } from 'react';
import { cn } from '@/utils/classNames';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Custom cell renderer; defaults to `row[key]`. */
  render?: (row: T) => ReactNode;
  /** Relative column width, e.g. '20%'. */
  width?: string;
  /** Use stronger text for this column. */
  emphasis?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Makes rows clickable (mouse, Enter or Space). */
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  /** `compact` = small uppercase headers, `comfortable` = larger rows with striping. */
  density?: 'compact' | 'comfortable';
  className?: string;
}

/** Generic, column-driven table used for lists of records. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyMessage = 'No records found.',
  density = 'compact',
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn(styles.wrapper, styles[density], className)}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className={cn(onRowClick && styles.clickable)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn(column.emphasis && styles.emphasis)}>
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
