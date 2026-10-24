# Export formats (Phase 1)

Package: `@pfmp/export-engine`. Jobs: `ExportService` + `apps/worker`.

| Format | Content | Notes |
|--------|---------|-------|
| **PDF** | A4, Persian/RTL capable | Worker: Playwright Chromium → real `%PDF`. Without Chromium / `PFMP_PDF_HTML_ONLY=true`: A4 RTL **HTML** print-ready bytes (same job API). Subpath `@pfmp/export-engine/pdf-chromium` is **worker-only** (not imported by Next). |
| **CSV** | UTF-8 with BOM | Excel-friendly for Persian text |
| **XLSX** | Spreadsheet bytes | Openable in Excel / LibreOffice |
| **JSON** | Structured subset | Round-trip friendly for tasks export payload |

## API flow

1. Authenticated `POST /api/v1/exports` enqueues job
2. Worker (or sync process) builds artifact under `exports/<workspaceId>/`
3. Poll job; download via authenticated artifact route

## Authz

Every job/artifact read is workspace-scoped. Cross-workspace forged IDs fail closed (Stage 5 security tests).

## Fonts / RTL

HTML template uses `dir="rtl"` and `@page` A4 for `locale=fa`. Chromium printBackground embeds layout; pixel-perfect Persian font licensing for every host is an ops concern — verify fonts on the worker image in production.
