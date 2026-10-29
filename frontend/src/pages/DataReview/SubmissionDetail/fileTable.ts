import type { DataTableColumn } from '@/components';
import type {
  FileCellValue,
  FileColumn,
  FileRow,
  FileTable,
  Submission,
} from '@/types/submission';
import { downloadCsv } from '@/utils/downloadCsv';

// Helpers shared by the selection and rejection steps.

export function formatCell(value: FileCellValue): string {
  return value === null || value === '' ? '—' : String(value);
}

/** DataTable columns for whatever columns a file contains (rows carry their cells in `values`). */
export function columnsFor<T extends Pick<FileRow, 'values'>>(
  columns: FileColumn[],
): DataTableColumn<T>[] {
  return columns.map((column) => ({
    key: column.key,
    header: column.label,
    render: (row) => formatCell(row.values[column.key]),
  }));
}

export function toColumns(table: FileTable): DataTableColumn<FileRow>[] {
  return columnsFor(table.columns);
}

export function downloadTable(submission: Submission, fileName: string, table: FileTable) {
  const baseName = `${submission.fileName.replace(/\.[^.]+$/, '')}-${fileName}`;
  downloadCsv(
    `${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`,
    table.columns.map((column) => column.label),
    table.rows.map((row) => table.columns.map((column) => row.values[column.key])),
  );
}
