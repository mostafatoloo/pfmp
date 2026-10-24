import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export type TaskRecord = {
  id: string;
  workspaceId: string;
  title: string;
  notes: string | null;
  status: string;
  dueAtUtc: Date | null;
  originalDueAtUtc: Date | null;
  completedAtUtc: Date | null;
  projectId: string | null;
  courseId: string | null;
  priority: number | null;
  pomodoroEstimate: number | null;
  createdAtUtc: Date;
  updatedAtUtc: Date;
  deletedAtUtc: Date | null;
};

export type TaskListFilters = {
  status?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  q?: string;
  preset?: "overdue" | "upcoming";
};

export type TaskCreateInput = {
  title: string;
  notes?: string | null;
  status?: string;
  dueAtUtc?: Date | null;
  projectId?: string | null;
  courseId?: string | null;
  priority?: number | null;
  pomodoroEstimate?: number | null;
};

export type TaskUpdateInput = {
  title?: string;
  notes?: string | null;
  status?: string;
  dueAtUtc?: Date | null;
  projectId?: string | null;
  courseId?: string | null;
  priority?: number | null;
  pomodoroEstimate?: number | null;
};

export class TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(workspaceId: string, actorUserId: string, input: TaskCreateInput): Promise<TaskRecord> {
    const status = input.status ?? "inbox";
    const dueAtUtc = input.dueAtUtc ?? null;
    const task = await this.prisma.task.create({
      data: {
        workspaceId,
        title: input.title,
        notes: input.notes ?? null,
        status,
        dueAtUtc,
        originalDueAtUtc: dueAtUtc,
        projectId: input.projectId ?? null,
        courseId: input.courseId ?? null,
        priority: input.priority ?? null,
        pomodoroEstimate: input.pomodoroEstimate ?? null,
        history: {
          create: {
            workspaceId,
            eventType: "created",
            fromJson: null,
            toJson: JSON.stringify({
              title: input.title,
              status,
              dueAtUtc: dueAtUtc?.toISOString() ?? null,
            }),
            actorUserId,
          },
        },
      },
    });
    return task;
  }

  async getById(workspaceId: string, id: string): Promise<TaskRecord | null> {
    return this.prisma.task.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
  }

  async list(workspaceId: string, filters: TaskListFilters = {}): Promise<TaskRecord[]> {
    const now = utcNow();
    const where: Record<string, unknown> = {
      workspaceId,
      deletedAtUtc: null,
    };
    if (filters.status) where.status = filters.status;
    if (filters.q) {
      where.title = { contains: filters.q };
    }

    const due: Record<string, Date> = {};
    if (filters.dueBefore) due.lte = filters.dueBefore;
    if (filters.dueAfter) due.gte = filters.dueAfter;
    if (filters.preset === "overdue") {
      where.dueAtUtc = { lt: now };
      where.status = filters.status ?? { notIn: ["completed", "cancelled"] };
    } else if (filters.preset === "upcoming") {
      where.dueAtUtc = { gte: now };
      where.status = filters.status ?? { notIn: ["completed", "cancelled"] };
    } else if (Object.keys(due).length) {
      where.dueAtUtc = due;
    }

    return this.prisma.task.findMany({
      where,
      orderBy: [{ dueAtUtc: "asc" }, { updatedAtUtc: "desc" }],
    });
  }

  async update(
    workspaceId: string,
    id: string,
    actorUserId: string,
    input: TaskUpdateInput,
  ): Promise<TaskRecord | null> {
    const existing = await this.getById(workspaceId, id);
    if (!existing) return null;

    const data: Record<string, unknown> = {};
    const from: Record<string, unknown> = {};
    const to: Record<string, unknown> = {};
    let eventType = "updated";

    if (input.title !== undefined && input.title !== existing.title) {
      from.title = existing.title;
      to.title = input.title;
      data.title = input.title;
    }
    if (input.notes !== undefined && input.notes !== existing.notes) {
      from.notes = existing.notes;
      to.notes = input.notes;
      data.notes = input.notes;
    }
    if (input.priority !== undefined && input.priority !== existing.priority) {
      from.priority = existing.priority;
      to.priority = input.priority;
      data.priority = input.priority;
    }
    if (input.projectId !== undefined && input.projectId !== existing.projectId) {
      from.projectId = existing.projectId;
      to.projectId = input.projectId;
      data.projectId = input.projectId;
    }
    if (input.courseId !== undefined && input.courseId !== existing.courseId) {
      from.courseId = existing.courseId;
      to.courseId = input.courseId;
      data.courseId = input.courseId;
    }
    if (
      input.pomodoroEstimate !== undefined &&
      input.pomodoroEstimate !== existing.pomodoroEstimate
    ) {
      from.pomodoroEstimate = existing.pomodoroEstimate;
      to.pomodoroEstimate = input.pomodoroEstimate;
      data.pomodoroEstimate = input.pomodoroEstimate;
    }

    if (input.status !== undefined && input.status !== existing.status) {
      from.status = existing.status;
      to.status = input.status;
      data.status = input.status;
      eventType = "status_changed";
      if (input.status === "completed") {
        data.completedAtUtc = utcNow();
      }
    }

    if (input.dueAtUtc !== undefined) {
      const nextDue = input.dueAtUtc;
      const prevIso = existing.dueAtUtc?.toISOString() ?? null;
      const nextIso = nextDue?.toISOString() ?? null;
      if (prevIso !== nextIso) {
        from.dueAtUtc = prevIso;
        to.dueAtUtc = nextIso;
        data.dueAtUtc = nextDue;
        eventType = "rescheduled";
        // Preserve originalDueAtUtc: set only if never scheduled before
        if (existing.originalDueAtUtc == null && nextDue != null) {
          data.originalDueAtUtc = nextDue;
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const [task] = await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id },
        data,
      }),
      this.prisma.taskHistory.create({
        data: {
          workspaceId,
          taskId: id,
          eventType,
          fromJson: JSON.stringify(from),
          toJson: JSON.stringify(to),
          actorUserId,
        },
      }),
    ]);

    // Re-fetch to ensure workspace scope (update by id alone is guarded by prior getById)
    return this.getById(workspaceId, task.id);
  }

  async softDelete(workspaceId: string, id: string, actorUserId: string): Promise<boolean> {
    const existing = await this.getById(workspaceId, id);
    if (!existing) return false;
    await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id },
        data: { deletedAtUtc: utcNow() },
      }),
      this.prisma.taskHistory.create({
        data: {
          workspaceId,
          taskId: id,
          eventType: "deleted",
          fromJson: JSON.stringify({ deletedAtUtc: null }),
          toJson: JSON.stringify({ deletedAtUtc: utcNow().toISOString() }),
          actorUserId,
        },
      }),
    ]);
    return true;
  }

  async listHistory(workspaceId: string, taskId: string) {
    const task = await this.getById(workspaceId, taskId);
    if (!task) return null;
    return this.prisma.taskHistory.findMany({
      where: { workspaceId, taskId },
      orderBy: { createdAtUtc: "asc" },
    });
  }
}
