import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";
import { ExportService } from "../../src/export-service";
import { TaskService } from "../../src/task-service";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true";

describe("Stage 5 export PDF (worker Playwright path)", () => {
  let prisma: PrismaClient;
  let workspaceId: string;
  let userId: string;
  let exports: ExportService;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = createPrismaClient(databaseUrl);
    await prisma.$connect();
    userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        name: "Pdf",
        email: `pdf-${userId.slice(0, 8)}@example.com`,
        emailVerified: true,
      },
    });
    workspaceId = (await new WorkspaceRepository(prisma).createPersonalWorkspace(userId)).id;
    await new TaskService(prisma).create(workspaceId, userId, { title: "کار PDF" });
    exports = new ExportService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("renders real %PDF via injected chromium renderer when available", async () => {
    let renderPdf: ((html: string) => Promise<Buffer>) | undefined;
    try {
      const mod = await import("@pfmp/export-engine/pdf-chromium");
      renderPdf = mod.renderHtmlToPdf;
    } catch {
      renderPdf = undefined;
    }

    const job = await exports.enqueue(workspaceId, {
      format: "pdf",
      reportType: "tasks",
      locale: "fa",
    });
    const artifact = await exports.processJob(job.id, { renderPdf });
    const fs = await import("node:fs/promises");
    const bytes = await fs.readFile(artifact.storagePath);

    if (renderPdf) {
      expect(bytes.subarray(0, 4).toString("utf8")).toBe("%PDF");
      expect(bytes.length).toBeGreaterThan(500);
    } else {
      // Fallback path still has RTL A4 HTML
      const text = bytes.toString("utf8");
      expect(text).toContain('dir="rtl"');
      expect(text).toContain("@page");
    }
  }, 120_000);
});
