import type { PrismaClient } from "./client";
import { durationSecondsBetween, utcNow } from "./conventions";

export class PomodoroServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "PomodoroServiceError";
  }
}

export class PomodoroService {
  constructor(private readonly prisma: PrismaClient) {}

  async getOrCreateConfig(workspaceId: string) {
    const existing = await this.prisma.pomodoroConfig.findUnique({ where: { workspaceId } });
    if (existing) return existing;
    return this.prisma.pomodoroConfig.create({
      data: { workspaceId },
    });
  }

  async updateConfig(
    workspaceId: string,
    input: {
      workSeconds?: number;
      shortBreakSeconds?: number;
      longBreakSeconds?: number;
      longBreakEvery?: number;
    },
  ) {
    await this.getOrCreateConfig(workspaceId);
    return this.prisma.pomodoroConfig.update({
      where: { workspaceId },
      data: input,
    });
  }

  listSessions(workspaceId: string, opts?: { userId?: string; taskId?: string }) {
    return this.prisma.pomodoroSession.findMany({
      where: {
        workspaceId,
        deletedAtUtc: null,
        ...(opts?.userId ? { userId: opts.userId } : {}),
        ...(opts?.taskId ? { taskId: opts.taskId } : {}),
      },
      orderBy: { startedAtUtc: "desc" },
    });
  }

  countCompletedWorkForTask(workspaceId: string, taskId: string) {
    return this.prisma.pomodoroSession.count({
      where: {
        workspaceId,
        taskId,
        kind: "work",
        endedAtUtc: { not: null },
        deletedAtUtc: null,
      },
    });
  }

  async startSession(
    workspaceId: string,
    kind: "work" | "short_break" | "long_break",
    opts?: { taskId?: string | null; userId?: string | null },
  ) {
    const open = await this.prisma.pomodoroSession.findFirst({
      where: { workspaceId, endedAtUtc: null, deletedAtUtc: null },
    });
    if (open) {
      throw new PomodoroServiceError("CONFLICT", "A Pomodoro session is already running");
    }
    return this.prisma.pomodoroSession.create({
      data: {
        workspaceId,
        kind,
        startedAtUtc: utcNow(),
        taskId: opts?.taskId ?? null,
        userId: opts?.userId ?? null,
      },
    });
  }

  async stopSession(workspaceId: string, id: string, linkTimeEntry = true) {
    const session = await this.prisma.pomodoroSession.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!session) throw new PomodoroServiceError("NOT_FOUND", "Pomodoro session not found");
    if (session.endedAtUtc) {
      throw new PomodoroServiceError("CONFLICT", "Session already stopped");
    }
    const endedAtUtc = utcNow();
    const durationSeconds = durationSecondsBetween(session.startedAtUtc, endedAtUtc);

    return this.prisma.$transaction(async (tx) => {
      let timeEntryId: string | null = null;
      if (linkTimeEntry && session.kind === "work") {
        const entry = await tx.timeEntry.create({
          data: {
            workspaceId,
            startedAtUtc: session.startedAtUtc,
            endedAtUtc,
            durationSeconds,
            source: "pomodoro",
            taskId: session.taskId,
          },
        });
        timeEntryId = entry.id;
      }
      return tx.pomodoroSession.update({
        where: { id },
        data: { endedAtUtc, durationSeconds, timeEntryId },
      });
    });
  }

  async getActive(workspaceId: string) {
    return this.prisma.pomodoroSession.findFirst({
      where: { workspaceId, endedAtUtc: null, deletedAtUtc: null },
      orderBy: { startedAtUtc: "desc" },
    });
  }
}
