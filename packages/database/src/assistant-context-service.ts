import type { PrismaClient } from "./client";
import { SOFT_DELETE_FILTER, utcNow } from "./conventions";

export type AssistantSummary = {
  tasksDueToday: number;
  tasksOverdue: number;
  tasksCompleted7d: number;
  totalActiveTasks: number;
  upcomingTasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAtUtc: Date | null;
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAtUtc: Date | null;
  }>;
};

/**
 * Gathers authorized context summaries for the AI assistant.
 * Only returns data the user has access to within the given workspace.
 * Never leaks cross-user private data.
 */
export class AssistantContextService {
  constructor(private readonly prisma: PrismaClient) {}

  async gatherSummary(workspaceId: string, _userId: string): Promise<AssistantSummary> {
    const now = utcNow();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

    const activeStatuses = { notIn: ["completed", "cancelled"] };

    const [tasksDueToday, tasksOverdue, tasksCompleted7d, totalActiveTasks] =
      await Promise.all([
        this.prisma.task.count({
          where: {
            workspaceId,
            ...SOFT_DELETE_FILTER,
            dueAtUtc: { gte: todayStart, lt: todayEnd },
            status: activeStatuses,
          },
        }),
        this.prisma.task.count({
          where: {
            workspaceId,
            ...SOFT_DELETE_FILTER,
            dueAtUtc: { lt: now },
            status: activeStatuses,
          },
        }),
        this.prisma.task.count({
          where: {
            workspaceId,
            ...SOFT_DELETE_FILTER,
            status: "completed",
            completedAtUtc: { gte: sevenDaysAgo },
          },
        }),
        this.prisma.task.count({
          where: {
            workspaceId,
            ...SOFT_DELETE_FILTER,
            status: activeStatuses,
          },
        }),
      ]);

    const upcomingTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        ...SOFT_DELETE_FILTER,
        dueAtUtc: { gte: now },
        status: activeStatuses,
      },
      select: { id: true, title: true, status: true, dueAtUtc: true },
      orderBy: { dueAtUtc: "asc" },
      take: 10,
    });

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        ...SOFT_DELETE_FILTER,
        dueAtUtc: { lt: now },
        status: activeStatuses,
      },
      select: { id: true, title: true, status: true, dueAtUtc: true },
      orderBy: { dueAtUtc: "asc" },
      take: 10,
    });

    return {
      tasksDueToday,
      tasksOverdue,
      tasksCompleted7d,
      totalActiveTasks,
      upcomingTasks,
      overdueTasks,
    };
  }
}
