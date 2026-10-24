import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "./client";
import { JobQueue } from "./job-queue";
import { utcNow } from "./conventions";

export class ExportServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "ExportServiceError";
  }
}

export type ProcessJobOptions = {
  /**
   * Optional HTML→PDF renderer (worker injects Playwright).
   * When omitted, PDF format stores A4 RTL HTML (print-ready) bytes.
   */
  renderPdf?: (html: string) => Promise<Buffer>;
};

export class ExportService {
  private readonly jobs: JobQueue;

  constructor(private readonly prisma: PrismaClient) {
    this.jobs = new JobQueue(prisma);
  }

  async enqueue(
    workspaceId: string,
    input: {
      format: "pdf" | "csv" | "xlsx" | "json";
      reportType: string;
      fromUtc?: string;
      toUtc?: string;
      locale?: "fa" | "en";
    },
  ) {
    const job = await this.jobs.enqueue({
      type: `export.${input.format}`,
      workspaceId,
      payload: input,
    });
    return job;
  }

  async getJob(workspaceId: string, jobId: string) {
    const job = await this.jobs.get(workspaceId, jobId);
    if (!job) throw new ExportServiceError("NOT_FOUND", "Export job not found");
    return job;
  }

  async getArtifact(workspaceId: string, id: string) {
    const row = await this.prisma.exportArtifact.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!row) throw new ExportServiceError("NOT_FOUND", "Export artifact not found");
    return row;
  }

  /** Process an export job synchronously (API or worker). */
  async processJob(jobId: string, options: ProcessJobOptions = {}) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || !job.workspaceId) {
      throw new ExportServiceError("NOT_FOUND", "Job not found");
    }
    const payload = JSON.parse(job.payloadJson) as {
      format: "pdf" | "csv" | "xlsx" | "json";
      reportType: string;
      locale?: "fa" | "en";
      fromUtc?: string;
      toUtc?: string;
    };

    const { buildExport, buildPdfHtml } = await import("@pfmp/export-engine");
    const tasks = await this.prisma.task.findMany({
      where: { workspaceId: job.workspaceId, deletedAtUtc: null },
      take: 500,
    });
    const taskRows = tasks.map((t) => ({
      title: t.title,
      status: t.status,
      dueAtUtc: t.dueAtUtc?.toISOString() ?? null,
    }));

    let bytes: Buffer;
    let format = payload.format;
    let extension = payload.format === "xlsx" ? "xlsx" : payload.format;

    if (payload.format === "pdf" && options.renderPdf) {
      const html = buildPdfHtml({
        format: "pdf",
        locale: payload.locale ?? "fa",
        reportType: payload.reportType,
        tasks: taskRows,
      });
      bytes = await options.renderPdf(html);
      extension = "pdf";
    } else {
      const built = await buildExport({
        format: payload.format,
        locale: payload.locale ?? "en",
        reportType: payload.reportType,
        tasks: taskRows,
      });
      bytes = built.bytes;
      extension = built.extension;
      // keep artifact.format as requested format (pdf) even if HTML stored
      format = payload.format;
    }

    const dir = join(process.cwd(), "exports", job.workspaceId);
    await mkdir(dir, { recursive: true });
    const storagePath = join(dir, `${jobId}.${extension}`);
    await writeFile(storagePath, bytes);

    const artifact = await this.prisma.exportArtifact.create({
      data: {
        workspaceId: job.workspaceId,
        jobId: job.id,
        format,
        storagePath,
        expiresAtUtc: new Date(utcNow().getTime() + 7 * 86_400_000),
      },
    });
    await this.jobs.markSucceeded(job.id);
    return artifact;
  }
}
