import type { PrismaClient } from "./client";
import { durationSecondsBetween, utcNow } from "./conventions";

export class TimeServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "TIMER_ALREADY_RUNNING" | "VALIDATION_ERROR" | "CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "TimeServiceError";
  }
}

export class TimeService {
  constructor(private readonly prisma: PrismaClient) {}

  listEntries(workspaceId: string, from?: Date, to?: Date) {
    return this.prisma.timeEntry.findMany({
      where: {
        workspaceId,
        deletedAtUtc: null,
        ...(from || to
          ? {
              startedAtUtc: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { startedAtUtc: "desc" },
    });
  }

  async createManual(
    workspaceId: string,
    input: {
      startedAtUtc: Date;
      endedAtUtc: Date;
      taskId?: string | null;
      projectId?: string | null;
      note?: string | null;
    },
  ) {
    if (input.endedAtUtc <= input.startedAtUtc) {
      throw new TimeServiceError("VALIDATION_ERROR", "endedAtUtc must be after startedAtUtc");
    }
    const durationSeconds = durationSecondsBetween(input.startedAtUtc, input.endedAtUtc);
    return this.prisma.timeEntry.create({
      data: {
        workspaceId,
        startedAtUtc: input.startedAtUtc,
        endedAtUtc: input.endedAtUtc,
        durationSeconds,
        source: "manual",
        taskId: input.taskId ?? null,
        projectId: input.projectId ?? null,
        note: input.note ?? null,
      },
    });
  }

  async softDeleteEntry(workspaceId: string, id: string) {
    const row = await this.prisma.timeEntry.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!row) throw new TimeServiceError("NOT_FOUND", "Time entry not found");
    await this.prisma.timeEntry.update({
      where: { id },
      data: { deletedAtUtc: utcNow() },
    });
  }

  getActiveTimer(workspaceId: string) {
    return this.prisma.activeTimer.findFirst({ where: { workspaceId } });
  }

  async startTimer(
    workspaceId: string,
    input: { taskId?: string | null; projectId?: string | null; note?: string | null } = {},
  ) {
    const existing = await this.getActiveTimer(workspaceId);
    if (existing) {
      throw new TimeServiceError("TIMER_ALREADY_RUNNING", "An active timer already exists");
    }
    return this.prisma.activeTimer.create({
      data: {
        workspaceId,
        startedAtUtc: utcNow(),
        taskId: input.taskId ?? null,
        projectId: input.projectId ?? null,
        note: input.note ?? null,
      },
    });
  }

  async stopTimer(workspaceId: string) {
    const active = await this.getActiveTimer(workspaceId);
    if (!active) throw new TimeServiceError("NOT_FOUND", "No active timer");
    const endedAtUtc = utcNow();
    const durationSeconds = durationSecondsBetween(active.startedAtUtc, endedAtUtc);
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.timeEntry.create({
        data: {
          workspaceId,
          startedAtUtc: active.startedAtUtc,
          endedAtUtc,
          durationSeconds,
          source: "timer",
          taskId: active.taskId,
          projectId: active.projectId,
          note: active.note,
        },
      });
      await tx.activeTimer.delete({ where: { id: active.id } });
      return entry;
    });
  }
}
