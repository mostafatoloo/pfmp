import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export class NotificationServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "DELIVERY_DUPLICATE",
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

  /**
   * Record an idempotent delivery attempt. Returns the existing record if the
   * idempotencyKey was already used (no duplicate sends).
   */
  async recordDelivery(input: {
    notificationId?: string | null;
    userId: string;
    channel: string;
    idempotencyKey: string;
    status: string;
    providerMessageId?: string | null;
  }) {
    const existing = await this.prisma.notificationDelivery.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;

    return this.prisma.notificationDelivery.create({
      data: {
        notificationId: input.notificationId ?? null,
        userId: input.userId,
        channel: input.channel,
        idempotencyKey: input.idempotencyKey,
        status: input.status,
        providerMessageId: input.providerMessageId ?? null,
      },
    });
  }

  async markDeliverySent(idempotencyKey: string, providerMessageId?: string) {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { idempotencyKey },
    });
    if (!delivery) {
      throw new NotificationServiceError("NOT_FOUND", "Delivery record not found");
    }

    return this.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "sent",
        sentAtUtc: utcNow(),
        attempts: delivery.attempts + 1,
        providerMessageId: providerMessageId ?? delivery.providerMessageId,
      },
    });
  }

  async markDeliveryFailed(idempotencyKey: string, error: string) {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { idempotencyKey },
    });
    if (!delivery) {
      throw new NotificationServiceError("NOT_FOUND", "Delivery record not found");
    }

    return this.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "failed",
        attempts: delivery.attempts + 1,
        lastError: error,
      },
    });
  }
}
