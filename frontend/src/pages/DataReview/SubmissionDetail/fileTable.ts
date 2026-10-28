import type { DataTableColumn } from '@/components';
import type { FileCellValue, FileRow, FileTable, Submission } from '@/types/submission';
import { downloadCsv } from '@/utils/downloadCsv';

// Helpers shared by the selection and rejection steps.

function formatCell(value: FileCellValue): string {
  return value === null || value === '' ? '—' : String(value);
}

/** DataTable columns for whatever columns the file contains. */
export function toColumns(table: FileTable): DataTableColumn<FileRow>[] {
  return table.columns.map((column) => ({
    key: column.key,
    header: column.label,
    render: (row) => formatCell(row.values[column.key]),
  }));
}

export function downloadTable(submission: Submission, fileName: string, table: FileTable) {
  const baseName = `${submission.fileName.replace(/\.[^.]+$/, '')}-${fileName}`;
  downloadCsv(
    `${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`,
    table.columns.map((column) => column.label),
    table.rows.map((row) => table.columns.map((column) => row.values[column.key])),
  );
}
