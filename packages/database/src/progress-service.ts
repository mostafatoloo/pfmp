import type { PrismaClient } from "./client";

/** Planned vs actual aggregates — no invented causal explanations (M7). */
export class ProgressQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  async summary(workspaceId: string, from: Date, to: Date) {
    const [tasks, timeEntries, topicProgress, scheduleItems] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          workspaceId,
          deletedAtUtc: null,
          OR: [
            { dueAtUtc: { gte: from, lte: to } },
            { completedAtUtc: { gte: from, lte: to } },
            { createdAtUtc: { gte: from, lte: to } },
          ],
        },
      }),
      this.prisma.timeEntry.findMany({
        where: {
          workspaceId,
          deletedAtUtc: null,
          startedAtUtc: { gte: from, lte: to },
        },
      }),
      this.prisma.topicProgress.findMany({
        where: { workspaceId, deletedAtUtc: null },
      }),
      this.prisma.scheduleItem.findMany({
        where: {
          workspaceId,
          deletedAtUtc: null,
          startsAtUtc: { gte: from, lte: to },
        },
      }),
    ]);

    const completed = tasks.filter((t) => t.status === "completed").length;
    const plannedSeconds = scheduleItems.reduce((s, i) => s + i.durationSeconds, 0);
    const actualSeconds = timeEntries.reduce((s, e) => s + (e.durationSeconds ?? 0), 0);
    const withDue = tasks.filter((t) => t.dueAtUtc);
    const onTime = withDue.filter(
      (t) =>
        t.status === "completed" &&
        t.completedAtUtc &&
        t.dueAtUtc &&
        t.completedAtUtc.getTime() <= t.dueAtUtc.getTime(),
    ).length;

    return {
      range: { fromUtc: from.toISOString(), toUtc: to.toISOString() },
      tasks: {
        total: tasks.length,
        completed,
        completionRate: tasks.length ? completed / tasks.length : null,
      },
      time: {
        plannedSeconds,
        actualSeconds,
      },
      deadlineAdherence: {
        withDue: withDue.length,
        completedOnTime: onTime,
        rate: withDue.length ? onTime / withDue.length : null,
      },
      topicProgress: topicProgress.map((p) => ({
        topicId: p.topicId,
        measureType: p.measureType,
        plannedValue: p.plannedValue != null ? Number(p.plannedValue) : null,
        actualValue: p.actualValue != null ? Number(p.actualValue) : null,
      })),
      // Explicitly no "causes" / narrative fields
    };
  }
}
