import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export class ReminderServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "VALIDATION",
    message: string,
  ) {
    super(message);
    this.name = "ReminderServiceError";
  }
}

export class ReminderService {
  constructor(private readonly prisma: PrismaClient) {}

  list(workspaceId: string, userId: string) {
    return this.prisma.reminder.findMany({
      where: { workspaceId, userId, deletedAtUtc: null },
      orderBy: { remindAtUtc: "asc" },
    });
  }

  listInRange(workspaceId: string, from: Date, to: Date) {
    return this.prisma.reminder.findMany({
      where: {
        workspaceId,
        deletedAtUtc: null,
        remindAtUtc: { gte: from, lte: to },
      },
      orderBy: { remindAtUtc: "asc" },
    });
  }

  async create(
    workspaceId: string,
    userId: string,
    input: { title: string; notes?: string | null; remindAtUtc: Date },
  ) {
    const title = input.title.trim();
    if (!title) throw new ReminderServiceError("VALIDATION", "Title required");
    if (Number.isNaN(input.remindAtUtc.getTime())) {
      throw new ReminderServiceError("VALIDATION", "Invalid date");
    }
    return this.prisma.reminder.create({
      data: {
        workspaceId,
        userId,
        title,
        notes: input.notes?.trim() || null,
        remindAtUtc: input.remindAtUtc,
      },
    });
  }

  async update(
    workspaceId: string,
    userId: string,
    id: string,
    input: { title?: string; notes?: string | null; remindAtUtc?: Date },
  ) {
    const row = await this.prisma.reminder.findFirst({
      where: { id, workspaceId, userId, deletedAtUtc: null },
    });
    if (!row) throw new ReminderServiceError("NOT_FOUND", "Reminder not found");
    if (input.title !== undefined && !input.title.trim()) {
      throw new ReminderServiceError("VALIDATION", "Title required");
    }
    if (input.remindAtUtc && Number.isNaN(input.remindAtUtc.getTime())) {
      throw new ReminderServiceError("VALIDATION", "Invalid date");
    }
    return this.prisma.reminder.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
        remindAtUtc: input.remindAtUtc,
      },
    });
  }

  async remove(workspaceId: string, userId: string, id: string) {
    const row = await this.prisma.reminder.findFirst({
      where: { id, workspaceId, userId, deletedAtUtc: null },
    });
    if (!row) throw new ReminderServiceError("NOT_FOUND", "Reminder not found");
    return this.prisma.reminder.update({
      where: { id },
      data: { deletedAtUtc: utcNow() },
    });
  }
}
