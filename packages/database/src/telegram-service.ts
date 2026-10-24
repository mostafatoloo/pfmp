import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export class TelegramServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INVALID_TOKEN" | "EXPIRED" | "ALREADY_LINKED",
    message: string,
  ) {
    super(message);
    this.name = "TelegramServiceError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class TelegramService {
  constructor(private readonly prisma: PrismaClient) {}

  async getActiveLink(userId: string) {
    return this.prisma.telegramLink.findFirst({
      where: { userId, unlinkedAtUtc: null },
    });
  }

  async createLinkToken(userId: string, ttlMinutes = 15) {
    const token = randomBytes(16).toString("base64url");
    await this.prisma.telegramLinkToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAtUtc: new Date(Date.now() + ttlMinutes * 60_000),
      },
    });
    return token;
  }

  async consumeLinkToken(token: string, telegramUserId: string, chatId: string) {
    const row = await this.prisma.telegramLinkToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!row || row.usedAtUtc) {
      throw new TelegramServiceError("INVALID_TOKEN", "Invalid linking token");
    }
    if (row.expiresAtUtc.getTime() < Date.now()) {
      throw new TelegramServiceError("EXPIRED", "Linking token expired");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.telegramLinkToken.update({
        where: { id: row.id },
        data: { usedAtUtc: utcNow() },
      });
      const existing = await tx.telegramLink.findUnique({ where: { userId: row.userId } });
      if (existing && !existing.unlinkedAtUtc) {
        return tx.telegramLink.update({
          where: { id: existing.id },
          data: { telegramUserId, chatId, linkedAtUtc: utcNow(), unlinkedAtUtc: null },
        });
      }
      if (existing) {
        return tx.telegramLink.update({
          where: { id: existing.id },
          data: { telegramUserId, chatId, linkedAtUtc: utcNow(), unlinkedAtUtc: null },
        });
      }
      return tx.telegramLink.create({
        data: { userId: row.userId, telegramUserId, chatId },
      });
    });
  }

  async unlink(userId: string) {
    const link = await this.getActiveLink(userId);
    if (!link) throw new TelegramServiceError("NOT_FOUND", "Not linked");
    return this.prisma.telegramLink.update({
      where: { id: link.id },
      data: { unlinkedAtUtc: utcNow() },
    });
  }

  async findUserByChatId(chatId: string) {
    return this.prisma.telegramLink.findFirst({
      where: { chatId, unlinkedAtUtc: null },
    });
  }
}
