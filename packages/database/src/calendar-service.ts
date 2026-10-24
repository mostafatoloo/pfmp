import type { PrismaClient } from "./client";

export type CalendarItem = {
  id: string;
  kind: "task_due" | "schedule" | "time" | "reminder";
  title: string;
  startsAtUtc: string;
  endsAtUtc: string | null;
};

export class CalendarQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  async query(workspaceId: string, from: Date, to: Date): Promise<CalendarItem[]> {
    const [tasks, scheduleItems, timeEntries, reminders] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          workspaceId,
          deletedAtUtc: null,
          dueAtUtc: { gte: from, lte: to },
        },
      }),
      this.prisma.scheduleItem.findMany({
        where: {
          workspaceId,
          deletedAtUtc: null,
          startsAtUtc: { lte: to },
          endsAtUtc: { gte: from },
        },
      }),
      this.prisma.timeEntry.findMany({
        where: {
          workspaceId,
          deletedAtUtc: null,
          startedAtUtc: { gte: from, lte: to },
        },
      }),
      this.prisma.reminder.findMany({
        where: {
          workspaceId,
          deletedAtUtc: null,
          remindAtUtc: { gte: from, lte: to },
        },
      }),
    ]);

    const items: CalendarItem[] = [
      ...tasks.map((t) => ({
        id: t.id,
        kind: "task_due" as const,
        title: t.title,
        startsAtUtc: t.dueAtUtc!.toISOString(),
        endsAtUtc: null,
      })),
      ...scheduleItems.map((s) => ({
        id: s.id,
        kind: "schedule" as const,
        title: s.title,
        startsAtUtc: s.startsAtUtc.toISOString(),
        endsAtUtc: s.endsAtUtc.toISOString(),
      })),
      ...timeEntries.map((e) => ({
        id: e.id,
        kind: "time" as const,
        title: e.note || `Time (${e.source})`,
        startsAtUtc: e.startedAtUtc.toISOString(),
        endsAtUtc: e.endedAtUtc?.toISOString() ?? null,
      })),
      ...reminders.map((r) => ({
        id: r.id,
        kind: "reminder" as const,
        title: r.title,
        startsAtUtc: r.remindAtUtc.toISOString(),
        endsAtUtc: null,
      })),
    ];

    items.sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc));
    return items;
  }
}
