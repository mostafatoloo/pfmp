import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export class NotificationServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "NotificationServiceError";
  }
}

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  create(
    workspaceId: string,
    userId: string,
    input: { title: string; body?: string | null; channel?: string },
  ) {
    return this.prisma.notification.create({
      data: {
        workspaceId,
        userId,
        title: input.title,
        body: input.body ?? null,
        channel: input.channel ?? "in_app",
      },
    });
  }

  list(workspaceId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { workspaceId, userId, deletedAtUtc: null },
      orderBy: { createdAtUtc: "desc" },
    });
  }

  async markRead(workspaceId: string, userId: string, id: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, workspaceId, userId, deletedAtUtc: null },
    });
    if (!row) throw new NotificationServiceError("NOT_FOUND", "Notification not found");
    return this.prisma.notification.update({
      where: { id },
      data: { readAtUtc: utcNow() },
    });
  }
}
