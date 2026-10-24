import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";
import { TaskService, TaskServiceError } from "../../src/task-service";
import { TimeService, TimeServiceError } from "../../src/time-service";
import { ExportService, ExportServiceError } from "../../src/export-service";
import { PlanProposalService, PlanProposalServiceError } from "../../src/plan-proposal-service";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true";

describe("Stage 5 security + critical paths (SQL Server)", () => {
  let prisma: PrismaClient;
  let userA: string;
  let userB: string;
  let wsA: string;
  let wsB: string;
  let tasks: TaskService;
  let time: TimeService;
  let exports: ExportService;
  let proposals: PlanProposalService;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = createPrismaClient(databaseUrl);
    await prisma.$connect();
    userA = randomUUID();
    userB = randomUUID();
    await prisma.user.createMany({
      data: [
        {
          id: userA,
          name: "SecA",
          email: `seca-${userA.slice(0, 8)}@example.com`,
          emailVerified: true,
        },
        {
          id: userB,
          name: "SecB",
          email: `secb-${userB.slice(0, 8)}@example.com`,
          emailVerified: true,
        },
      ],
    });
    const workspaces = new WorkspaceRepository(prisma);
    wsA = (await workspaces.createPersonalWorkspace(userA)).id;
    wsB = (await workspaces.createPersonalWorkspace(userB)).id;
    tasks = new TaskService(prisma);
    time = new TimeService(prisma);
    exports = new ExportService(prisma);
    proposals = new PlanProposalService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("forged task id from workspace B is not readable by A", async () => {
    const foreign = await tasks.create(wsB, userB, { title: "B secret" });
    await expect(tasks.get(wsA, foreign.id)).rejects.toBeInstanceOf(TaskServiceError);
    await expect(tasks.update(wsA, foreign.id, userA, { title: "hack" })).rejects.toBeInstanceOf(
      TaskServiceError,
    );
  });

  it("reschedule history + originalDueAtUtc invariant", async () => {
    const due1 = new Date("2026-12-01T09:00:00.000Z");
    const due2 = new Date("2026-12-10T09:00:00.000Z");
    const t = await tasks.create(wsA, userA, {
      title: "Reschedule me",
      status: "planned",
      dueAtUtc: due1,
    });
    const updated = await tasks.update(wsA, t.id, userA, { dueAtUtc: due2 });
    expect(updated.originalDueAtUtc?.toISOString()).toBe(due1.toISOString());
    expect(updated.dueAtUtc?.toISOString()).toBe(due2.toISOString());
    const history = await tasks.history(wsA, t.id);
    expect(history.some((h) => h.eventType === "rescheduled")).toBe(true);
  });

  it("timer recovers after simulated refresh; duplicate start blocked", async () => {
    const started = await time.startTimer(wsA, { note: "deep work" });
    // "refresh" = new service instance reading same DB
    const time2 = new TimeService(prisma);
    const recovered = await time2.getActiveTimer(wsA);
    expect(recovered?.id).toBe(started.id);
    await expect(time2.startTimer(wsA)).rejects.toBeInstanceOf(TimeServiceError);
    const entry = await time2.stopTimer(wsA);
    expect(Number.isInteger(entry.durationSeconds)).toBe(true);
  });

  it("export artifact from B cannot be fetched with workspace A", async () => {
    const job = await exports.enqueue(wsB, { format: "json", reportType: "tasks", locale: "en" });
    const artifact = await exports.processJob(job.id);
    await expect(exports.getArtifact(wsA, artifact.id)).rejects.toBeInstanceOf(ExportServiceError);
    await expect(exports.getJob(wsA, job.id)).rejects.toBeInstanceOf(ExportServiceError);
  });

  it("AI unavailable when disabled; accept creates version; reject does not", async () => {
    await expect(
      proposals.request(wsA, { aiEnabled: false }),
    ).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });

    const pending = await proposals.request(wsA, { aiEnabled: true, promptSummary: "s5" });
    const versionsBefore = await prisma.scheduleVersion.count({
      where: { workspaceId: wsA, deletedAtUtc: null },
    });

    const toReject = await proposals.request(wsA, { aiEnabled: true });
    await proposals.reject(wsA, toReject.proposal.id, userA);
    const afterReject = await prisma.scheduleVersion.count({
      where: { workspaceId: wsA, deletedAtUtc: null },
    });
    expect(afterReject).toBe(versionsBefore);

    const accepted = await proposals.accept(wsA, pending.proposal.id, userA);
    expect(accepted.version.source).toBe("ai_accepted");
    await expect(proposals.accept(wsA, pending.proposal.id, userA)).rejects.toBeInstanceOf(
      PlanProposalServiceError,
    );
  });

  it("soft-deleted task hidden from default list", async () => {
    const t = await tasks.create(wsA, userA, { title: "To delete" });
    await tasks.softDelete(wsA, t.id, userA);
    const list = await tasks.list(wsA);
    expect(list.some((x) => x.id === t.id)).toBe(false);
  });
});
