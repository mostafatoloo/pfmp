import type { PrismaClient } from "./client";

export class NotificationPreferenceService {
  constructor(private readonly prisma: PrismaClient) {}

  list(userId: string) {
    return this.prisma.notificationPreference.findMany({ where: { userId } });
  }

  async upsert(
    userId: string,
    input: { category: string; channel: string; enabled: boolean; leadMinutes?: number | null },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_category_channel: {
          userId,
          category: input.category,
          channel: input.channel,
        },
      },
      create: {
        userId,
        category: input.category,
        channel: input.channel,
        enabled: input.enabled,
        leadMinutes: input.leadMinutes ?? null,
      },
      update: {
        enabled: input.enabled,
        leadMinutes: input.leadMinutes ?? null,
      },
    });
  }

  async isEnabled(userId: string, category: string, channel: string): Promise<boolean> {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_category_channel: { userId, category, channel },
      },
    });
    // Default: in_app on, others off until configured
    if (!pref) return channel === "in_app";
    return pref.enabled;
  }
}
