/** Stage 3 stub — PDF/CSV/XLSX/JSON builders implemented in Stage 4 (ADR-004). */

export type ExportFormat = "pdf" | "csv" | "xlsx" | "json";

export function supportedFormats(): ExportFormat[] {
  return ["pdf", "csv", "xlsx", "json"];
}

export function isExportImplemented(): boolean {
  return false;
}
