import type { ReactNode } from 'react';
import { cn } from '@/utils/classNames';
import { Checkbox } from '../Checkbox';
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
  /** Ticked row keys. Passing this (with `onSelectionChange`) adds a checkbox column. */
  selectedKeys?: ReadonlySet<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  /** Header of the checkbox column, e.g. "Approve". */
  selectionHeader?: string;
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
  selectedKeys,
  onSelectionChange,
  selectionHeader = 'Select',
  density = 'compact',
  className,
}: DataTableProps<T>) {
  const selectable = selectedKeys !== undefined && onSelectionChange !== undefined;
  const columnCount = columns.length + (selectable ? 1 : 0);

  const toggleRow = (key: string) => {
    if (!selectable) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  return (
    <div className={cn(styles.wrapper, styles[density], className)}>
      <table className={styles.table}>
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className={styles.selectCell}>
                {selectionHeader}
              </th>
            )}
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
              <td colSpan={columnCount} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = getRowKey(row);
              return (
                <tr
                  key={key}
                  className={cn(
                    onRowClick && styles.clickable,
                    selectedKeys?.has(key) && styles.selected,
                  )}
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
                  {selectable && (
                    <td className={styles.selectCell}>
                      <Checkbox
                        checked={selectedKeys.has(key)}
                        onChange={() => toggleRow(key)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`${selectionHeader} row ${key}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className={cn(column.emphasis && styles.emphasis)}>
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
