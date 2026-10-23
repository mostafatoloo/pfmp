import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export type JobType =
  | "export.pdf"
  | "export.csv"
  | "export.xlsx"
  | "export.json"
  | "ai.schedule_proposal"
  | "notification.dispatch"
  | "email.magic_link";

export class JobQueue {
  constructor(private readonly prisma: PrismaClient) {}

  enqueue(input: {
    type: JobType | string;
    payload: Record<string, unknown>;
    workspaceId?: string | null;
    runAfterUtc?: Date;
  }) {
    return this.prisma.job.create({
      data: {
        type: input.type,
        payloadJson: JSON.stringify(input.payload),
        status: "pending",
        workspaceId: input.workspaceId ?? null,
        runAfterUtc: input.runAfterUtc ?? utcNow(),
      },
    });
  }

  async get(workspaceId: string | null, id: string) {
    return this.prisma.job.findFirst({
      where: {
        id,
        ...(workspaceId ? { workspaceId } : {}),
      },
    });
  }

  /** Claim next pending job with a simple transactional lease (SQL Server). */
  async claimNext(workerId: string) {
    const now = utcNow();
    const pending = await this.prisma.job.findFirst({
      where: {
        status: "pending",
        runAfterUtc: { lte: now },
      },
      orderBy: { runAfterUtc: "asc" },
    });
    if (!pending) return null;

    const updated = await this.prisma.job.updateMany({
      where: { id: pending.id, status: "pending" },
      data: {
        status: "running",
        lockedAtUtc: now,
        lockedBy: workerId,
        attempts: { increment: 1 },
      },
    });
    if (updated.count === 0) return null;
    return this.prisma.job.findUnique({ where: { id: pending.id } });
  }

  async markSucceeded(id: string) {
    return this.prisma.job.update({
      where: { id },
      data: { status: "succeeded", lockedAtUtc: null, lockedBy: null },
    });
  }

  async markFailed(id: string, error: string, dead = false) {
    return this.prisma.job.update({
      where: { id },
      data: {
        status: dead ? "dead" : "failed",
        lastError: error.slice(0, 4000),
        lockedAtUtc: null,
        lockedBy: null,
      },
    });
  }
}
