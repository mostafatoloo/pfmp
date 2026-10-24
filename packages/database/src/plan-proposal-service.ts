import type { PrismaClient } from "./client";
import { JobQueue } from "./job-queue";
import { ScheduleService } from "./schedule-service";
import { utcNow } from "./conventions";

export class PlanProposalServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "CONFLICT" | "AI_UNAVAILABLE" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "PlanProposalServiceError";
  }
}

export class PlanProposalService {
  private readonly jobs: JobQueue;
  private readonly schedules: ScheduleService;

  constructor(private readonly prisma: PrismaClient) {
    this.jobs = new JobQueue(prisma);
    this.schedules = new ScheduleService(prisma);
  }

  list(workspaceId: string) {
    return this.prisma.planProposal.findMany({
      where: { workspaceId },
      orderBy: { createdAtUtc: "desc" },
    });
  }

  async get(workspaceId: string, id: string) {
    const row = await this.prisma.planProposal.findFirst({ where: { id, workspaceId } });
    if (!row) throw new PlanProposalServiceError("NOT_FOUND", "Plan proposal not found");
    return row;
  }

  /**
   * Enqueue AI proposal or create from stub when AI enabled.
   * When AI disabled → AI_UNAVAILABLE.
   */
  async request(
    workspaceId: string,
    input: {
      aiEnabled: boolean;
      promptSummary?: string;
      /** Pre-validated draft schedule JSON when using stub */
      stubProposal?: {
        items: {
          title: string;
          startsAtUtc: string;
          endsAtUtc: string;
          durationSeconds: number;
        }[];
        explanation?: string;
      };
    },
  ) {
    if (!input.aiEnabled) {
      throw new PlanProposalServiceError("AI_UNAVAILABLE", "AI schedule proposals are disabled");
    }

    const job = await this.jobs.enqueue({
      type: "ai.schedule_proposal",
      workspaceId,
      payload: { promptSummary: input.promptSummary ?? null },
    });

    // Stub provider: materialize pending proposal immediately for tests / offline AI
    const draft = input.stubProposal ?? {
      items: [
        {
          title: "Stub study block",
          startsAtUtc: new Date(Date.now() + 3600_000).toISOString(),
          endsAtUtc: new Date(Date.now() + 7200_000).toISOString(),
          durationSeconds: 3600,
        },
      ],
      explanation: "Stub provider draft — review before accept",
    };

    const proposal = await this.prisma.planProposal.create({
      data: {
        workspaceId,
        status: "pending",
        promptSummary: input.promptSummary ?? null,
        proposalJson: JSON.stringify(draft),
        explanation: draft.explanation ?? null,
        modelProvider: "stub",
      },
    });

    await this.jobs.markSucceeded(job.id);
    return { jobId: job.id, proposal };
  }

  /** Accept → new ScheduleVersion (source=ai_accepted). Never silent replace of items in-place. */
  async accept(workspaceId: string, id: string, userId: string) {
    const proposal = await this.get(workspaceId, id);
    if (proposal.status !== "pending") {
      throw new PlanProposalServiceError("CONFLICT", "Proposal is not pending");
    }
    const draft = JSON.parse(proposal.proposalJson) as {
      items: {
        title: string;
        startsAtUtc: string;
        endsAtUtc: string;
        durationSeconds: number;
      }[];
    };

    const version = await this.schedules.createVersion(workspaceId, {
      label: `AI accepted ${id.slice(0, 8)}`,
      source: "ai_accepted",
      supersedePrevious: true,
      items: (draft.items ?? []).map((i) => ({
        title: i.title,
        startsAtUtc: new Date(i.startsAtUtc),
        endsAtUtc: new Date(i.endsAtUtc),
        durationSeconds: i.durationSeconds,
      })),
    });

    const updated = await this.prisma.planProposal.update({
      where: { id },
      data: {
        status: "accepted",
        resolvedAtUtc: utcNow(),
        resolvedByUserId: userId,
      },
    });

    return { proposal: updated, version };
  }

  async reject(workspaceId: string, id: string, userId: string) {
    const proposal = await this.get(workspaceId, id);
    if (proposal.status !== "pending") {
      throw new PlanProposalServiceError("CONFLICT", "Proposal is not pending");
    }
    // Reject must not mutate schedule
    return this.prisma.planProposal.update({
      where: { id },
      data: {
        status: "rejected",
        resolvedAtUtc: utcNow(),
        resolvedByUserId: userId,
      },
    });
  }
}
