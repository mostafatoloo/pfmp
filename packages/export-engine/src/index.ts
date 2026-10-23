/** Export builders — PDF as A4 RTL HTML bytes (Playwright optional later); CSV/XLSX/JSON (ADR-004). */

export type ExportFormat = "pdf" | "csv" | "xlsx" | "json";

export type ExportTaskRow = {
  title: string;
  status: string;
  dueAtUtc: string | null;
};

export type BuildExportInput = {
  format: ExportFormat;
  locale: "fa" | "en";
  reportType: string;
  tasks: ExportTaskRow[];
};

export type BuildExportResult = {
  bytes: Buffer;
  contentType: string;
  extension: string;
};

export function supportedFormats(): ExportFormat[] {
  return ["pdf", "csv", "xlsx", "json"];
}

export function isExportImplemented(): boolean {
  return true;
}

function escapeCsv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsv(tasks: ExportTaskRow[], locale: "fa" | "en"): Buffer {
  const header = locale === "fa" ? "عنوان,وضعیت,موعد" : "title,status,dueAtUtc";
  const lines = [
    header,
    ...tasks.map((t) =>
      [escapeCsv(t.title), escapeCsv(t.status), t.dueAtUtc ?? ""].join(","),
    ),
  ];
  return Buffer.from(`\uFEFF${lines.join("\n")}`, "utf8");
}

function buildJson(tasks: ExportTaskRow[], reportType: string): Buffer {
  return Buffer.from(
    JSON.stringify({ reportType, exportedAtUtc: new Date().toISOString(), tasks }, null, 2),
    "utf8",
  );
}

function buildXlsx(tasks: ExportTaskRow[]): Buffer {
  const rows = tasks
    .map(
      (t) =>
        `<Row><Cell><Data ss:Type="String">${escapeXml(t.title)}</Data></Cell>` +
        `<Cell><Data ss:Type="String">${escapeXml(t.status)}</Data></Cell>` +
        `<Cell><Data ss:Type="String">${escapeXml(t.dueAtUtc ?? "")}</Data></Cell></Row>`,
    )
    .join("");
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Tasks"><Table>
  <Row><Cell><Data ss:Type="String">title</Data></Cell><Cell><Data ss:Type="String">status</Data></Cell><Cell><Data ss:Type="String">dueAtUtc</Data></Cell></Row>
  ${rows}
 </Table></Worksheet>
</Workbook>`;
  return Buffer.from(xml, "utf8");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A4 HTML for PDF — Persian RTL when locale=fa. */
export function buildPdfHtml(input: BuildExportInput): string {
  const dir = input.locale === "fa" ? "rtl" : "ltr";
  const lang = input.locale === "fa" ? "fa" : "en";
  const title = input.locale === "fa" ? "گزارش کارها" : "Tasks report";
  const rows = input.tasks
    .map(
      (t) =>
        `<tr><td>${escapeXml(t.title)}</td><td>${escapeXml(t.status)}</td><td>${escapeXml(t.dueAtUtc ?? "")}</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: "Vazirmatn", "Tahoma", sans-serif; font-size: 12pt; color: #111; }
  h1 { font-size: 18pt; margin: 0 0 12pt; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid #ccc; padding: 6pt 4pt; text-align: start; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead><tr><th>${input.locale === "fa" ? "عنوان" : "Title"}</th><th>${input.locale === "fa" ? "وضعیت" : "Status"}</th><th>${input.locale === "fa" ? "موعد" : "Due"}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

/**
 * Build export bytes.
 * PDF Stage 4: A4 RTL/LTR HTML document (print-ready). Chromium/Playwright conversion
 * can be wired in the worker without bundling Playwright into Next.js.
 */
export async function buildExport(input: BuildExportInput): Promise<BuildExportResult> {
  switch (input.format) {
    case "csv":
      return {
        bytes: buildCsv(input.tasks, input.locale),
        contentType: "text/csv; charset=utf-8",
        extension: "csv",
      };
    case "json":
      return {
        bytes: buildJson(input.tasks, input.reportType),
        contentType: "application/json",
        extension: "json",
      };
    case "xlsx":
      return {
        bytes: buildXlsx(input.tasks),
        contentType: "application/vnd.ms-excel",
        extension: "xlsx",
      };
    case "pdf": {
      const html = buildPdfHtml(input);
      return {
        bytes: Buffer.from(html, "utf8"),
        contentType: "text/html; charset=utf-8",
        extension: "html",
      };
    }
    default:
      throw new Error(`Unsupported format: ${input.format}`);
  }
}
