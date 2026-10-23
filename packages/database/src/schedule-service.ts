import { planDeterministic, type PlanningBlockInput } from "@pfmp/domain";
import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export class ScheduleServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "ScheduleServiceError";
  }
}

export class ScheduleService {
  constructor(private readonly prisma: PrismaClient) {}

  listVersions(workspaceId: string) {
    return this.prisma.scheduleVersion.findMany({
      where: { workspaceId, deletedAtUtc: null },
      orderBy: { createdAtUtc: "desc" },
    });
  }

  async getVersion(workspaceId: string, id: string) {
    const version = await this.prisma.scheduleVersion.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
      include: {
        items: {
          where: { deletedAtUtc: null },
          orderBy: { startsAtUtc: "asc" },
        },
      },
    });
    if (!version) throw new ScheduleServiceError("NOT_FOUND", "Schedule version not found");
    return version;
  }

  async createVersion(
    workspaceId: string,
    input: {
      label?: string | null;
      source: "manual" | "deterministic" | "ai_accepted";
      effectiveFromUtc?: Date | null;
      items: {
        title: string;
        startsAtUtc: Date;
        endsAtUtc: Date;
        durationSeconds: number;
        taskId?: string | null;
        courseId?: string | null;
        topicId?: string | null;
        projectId?: string | null;
        constraintJson?: string | null;
      }[];
      supersedePrevious?: boolean;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (input.supersedePrevious) {
        await tx.scheduleVersion.updateMany({
          where: { workspaceId, deletedAtUtc: null, supersededAtUtc: null },
          data: { supersededAtUtc: utcNow() },
        });
      }
      return tx.scheduleVersion.create({
        data: {
          workspaceId,
          label: input.label ?? null,
          source: input.source,
          effectiveFromUtc: input.effectiveFromUtc ?? utcNow(),
          items: {
            create: input.items.map((i) => ({
              workspaceId,
              title: i.title,
              startsAtUtc: i.startsAtUtc,
              endsAtUtc: i.endsAtUtc,
              durationSeconds: i.durationSeconds,
              taskId: i.taskId ?? null,
              courseId: i.courseId ?? null,
              topicId: i.topicId ?? null,
              projectId: i.projectId ?? null,
              constraintJson: i.constraintJson ?? null,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  /** Run deterministic engine; optionally persist as new version. Never silent-replaces. */
  runDeterministic(
    workspaceId: string,
    input: {
      windowStartUtc: string;
      blocks: PlanningBlockInput[];
      persist?: boolean;
      label?: string;
    },
  ) {
    const result = planDeterministic({
      windowStartUtc: input.windowStartUtc,
      blocks: input.blocks,
    });
    if (!input.persist) {
      return Promise.resolve({ preview: true as const, result, version: null });
    }
    return this.createVersion(workspaceId, {
      label: input.label ?? "Deterministic plan",
      source: "deterministic",
      supersedePrevious: true,
      items: result.items.map((i) => ({
        title: i.title,
        startsAtUtc: new Date(i.startsAtUtc),
        endsAtUtc: new Date(i.endsAtUtc),
        durationSeconds: i.durationSeconds,
        constraintJson: JSON.stringify({ sourceId: i.sourceId }),
      })),
    }).then((version) => ({ preview: false as const, result, version }));
  }
}
