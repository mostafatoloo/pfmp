import { describe, expect, it } from "vitest";
import { buildExport, buildPdfHtml } from "./index";

describe("export-engine", () => {
  const tasks = [{ title: "کار نمونه", status: "inbox", dueAtUtc: "2026-11-01T00:00:00.000Z" }];

  it("builds CSV with UTF-8 BOM", async () => {
    const r = await buildExport({ format: "csv", locale: "fa", reportType: "tasks", tasks });
    expect(r.bytes[0]).toBe(0xef);
    expect(r.bytes.toString("utf8")).toContain("کار نمونه");
  });

  it("builds Persian RTL PDF HTML", () => {
    const html = buildPdfHtml({ format: "pdf", locale: "fa", reportType: "tasks", tasks });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("lang=\"fa\"");
    expect(html).toContain("@page");
  });

  it("builds JSON round-trip subset", async () => {
    const r = await buildExport({ format: "json", locale: "en", reportType: "tasks", tasks });
    const parsed = JSON.parse(r.bytes.toString("utf8"));
    expect(parsed.tasks).toHaveLength(1);
  });
});
