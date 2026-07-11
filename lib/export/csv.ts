export type CsvPrimitive = string | number | boolean | null | undefined | Date;

export interface CsvColumn<Row> {
  header: string;
  value: (row: Row) => CsvPrimitive;
}

const FORMULA_PREFIX = /^[\t\r ]*[=+\-@]/;

export function sanitizeSpreadsheetText(value: string): string {
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

export function escapeCsvCell(value: CsvPrimitive): string {
  if (value == null) return "";
  const raw =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "string"
        ? sanitizeSpreadsheetText(value)
        : String(value);
  return /[",\r\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

export function createCsv<Row>(
  rows: readonly Row[],
  columns: readonly CsvColumn<Row>[],
  options: { includeBom?: boolean } = {},
): string {
  if (!columns.length)
    throw new RangeError("CSV export requires at least one column");
  const lines = [
    columns.map((column) => escapeCsvCell(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCsvCell(column.value(row))).join(","),
    ),
  ];
  return `${options.includeBom === false ? "" : "\uFEFF"}${lines.join("\r\n")}\r\n`;
}

export function csvDownloadFilename(
  dataset: string,
  exportedOn: string,
): string {
  const safeDataset = dataset
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exportedOn))
    throw new RangeError("Invalid export date");
  return `summer-os-${safeDataset || "data"}-${exportedOn}.csv`;
}
