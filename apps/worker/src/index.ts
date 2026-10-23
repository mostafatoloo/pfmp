/**
 * Job worker — claims export / notification / AI jobs from SQL Server Job table (ADR-003).
 * Playwright HTML→PDF is loaded only here (not in Next.js).
 */
import { createPrismaClient, ExportService, JobQueue, NotificationService } from "@pfmp/database";

const workerId = `worker-${process.pid}`;
const pollMs = Number(process.env.WORKER_POLL_MS ?? "2000");

async function pdfRenderer(): Promise<((html: string) => Promise<Buffer>) | undefined> {
  if (process.env.PFMP_PDF_HTML_ONLY === "true") return undefined;
  try {
    const { renderHtmlToPdf } = await import("@pfmp/export-engine/pdf-chromium");
    return renderHtmlToPdf;
  } catch (err) {
    console.warn(
      "[worker] Playwright PDF unavailable; storing HTML A4 RTL artifact",
      err instanceof Error ? err.message : err,
    );
    return undefined;
  }
}

async function handleJob(
  job: { id: string; type: string; workspaceId: string | null; payloadJson: string },
  prisma: ReturnType<typeof createPrismaClient>,
  renderPdf?: (html: string) => Promise<Buffer>,
) {
  const queue = new JobQueue(prisma);
  try {
    if (job.type.startsWith("export.")) {
      await new ExportService(prisma).processJob(job.id, {
        renderPdf: job.type === "export.pdf" ? renderPdf : undefined,
      });
      return;
    }
    if (job.type === "notification.dispatch") {
      const payload = JSON.parse(job.payloadJson) as {
        userId: string;
        title: string;
        body?: string;
      };
      if (job.workspaceId && payload.userId) {
        await new NotificationService(prisma).create(job.workspaceId, payload.userId, {
          title: payload.title,
          body: payload.body,
          channel: "in_app",
        });
      }
      await queue.markSucceeded(job.id);
      return;
    }
    if (job.type === "ai.schedule_proposal") {
      await queue.markSucceeded(job.id);
      return;
    }
    await queue.markFailed(job.id, `Unknown job type: ${job.type}`, true);
  } catch (err) {
    await queue.markFailed(job.id, err instanceof Error ? err.message : "unknown");
    throw err;
  }
}

export async function runWorkerLoop(once = false) {
  const prisma = createPrismaClient();
  const queue = new JobQueue(prisma);
  const renderPdf = await pdfRenderer();
  console.info(`[worker] started as ${workerId} pdf=${renderPdf ? "playwright" : "html"}`);

  do {
    const job = await queue.claimNext(workerId);
    if (job) {
      console.info(`[worker] claimed ${job.type} ${job.id}`);
      await handleJob(job, prisma, renderPdf);
    } else if (!once) {
      await new Promise((r) => setTimeout(r, pollMs));
    }
  } while (!once);

  await prisma.$disconnect();
}

export function workerReady(): boolean {
  return true;
}

const isMain =
  process.argv[1]?.includes("apps/worker") ||
  process.argv[1]?.endsWith("index.ts") ||
  process.argv[1]?.endsWith("index.js");

if (isMain) {
  runWorkerLoop(false).catch((err) => {
    console.error("[worker] fatal", err);
    process.exit(1);
  });
}
