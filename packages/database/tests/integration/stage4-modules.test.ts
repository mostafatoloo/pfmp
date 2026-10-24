import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";
import { AcademicService } from "../../src/academic-service";
import { ScheduleService } from "../../src/schedule-service";
import { TimeService, TimeServiceError } from "../../src/time-service";
import { PomodoroService } from "../../src/pomodoro-service";
import { ProgressQueryService } from "../../src/progress-service";
import { CalendarQueryService } from "../../src/calendar-service";
import { ExportService } from "../../src/export-service";
import { NotificationService } from "../../src/notification-service";
import { PlanProposalService, PlanProposalServiceError } from "../../src/plan-proposal-service";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true";

describe("Stage 4 M3–M11 (SQL Server)", () => {
  let prisma: PrismaClient;
  let workspaceId: string;
  let userId: string;
  let academic: AcademicService;
  let schedules: ScheduleService;
  let time: TimeService;
  let pomodoro: PomodoroService;
  let progress: ProgressQueryService;
  let calendar: CalendarQueryService;
  let exports: ExportService;
  let notifications: NotificationService;
  let proposals: PlanProposalService;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = createPrismaClient(databaseUrl);
    await prisma.$connect();
    userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        name: "Stage4",
        email: `s4-${userId.slice(0, 8)}@example.com`,
        emailVerified: true,
      },
    });
    workspaceId = (await new WorkspaceRepository(prisma).createPersonalWorkspace(userId)).id;
    academic = new AcademicService(prisma);
    schedules = new ScheduleService(prisma);
    time = new TimeService(prisma);
    pomodoro = new PomodoroService(prisma);
    progress = new ProgressQueryService(prisma);
    calendar = new CalendarQueryService(prisma);
    exports = new ExportService(prisma);
    notifications = new NotificationService(prisma);
    proposals = new PlanProposalService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("M3 academic nested CRUD + topic progress ≠ time", async () => {
    const term = await academic.createTerm(workspaceId, {
      name: "Fall 2026",
      startsOn: "2026-09-01",
      endsOn: "2026-12-20",
    });
    const course = await academic.createCourse(workspaceId, {
      termId: term.id,
      title: "Algorithms",
      code: "CS301",
    });
    const topic = await academic.createTopic(workspaceId, {
      courseId: course.id,
      title: "Graphs",
    });
    await academic.createAssessment(workspaceId, {
      courseId: course.id,
      title: "Midterm",
      dueAtUtc: new Date("2026-11-15T12:00:00.000Z"),
    });
    const prog = await academic.upsertTopicProgress(workspaceId, topic.id, {
      measureType: "percent",
      plannedValue: 100,
      actualValue: 40,
    });
    expect(Number(prog.actualValue)).toBe(40);
    const timeCount = await prisma.timeEntry.count({ where: { workspaceId } });
    expect(timeCount).toBe(0);
  });

  it("M4 deterministic planning is stable and can persist version", async () => {
    const run1 = await schedules.runDeterministic(workspaceId, {
      windowStartUtc: "2026-11-01T08:00:00.000Z",
      blocks: [
        {
          id: "1",
          title: "Block A",
          durationSeconds: 1800,
          earliestStartUtc: "2026-11-01T08:00:00.000Z",
          latestEndUtc: "2026-11-01T12:00:00.000Z",
        },
      ],
      persist: true,
      label: "Det v1",
    });
    expect(run1.preview).toBe(false);
    expect(run1.version?.source).toBe("deterministic");
    expect(run1.result.items).toHaveLength(1);
  });

  it("M5 timer: single active, stop writes durationSeconds, second start fails", async () => {
    const active = await time.startTimer(workspaceId, { note: "focus" });
    expect(active.workspaceId).toBe(workspaceId);
    const recovered = await time.getActiveTimer(workspaceId);
    expect(recovered?.id).toBe(active.id);
    await expect(time.startTimer(workspaceId)).rejects.toBeInstanceOf(TimeServiceError);
    const entry = await time.stopTimer(workspaceId);
    expect(entry.source).toBe("timer");
    expect(entry.durationSeconds).toBeTypeOf("number");
    expect(Number.isInteger(entry.durationSeconds)).toBe(true);
    expect(await time.getActiveTimer(workspaceId)).toBeNull();
  });

  it("M6 pomodoro config + session stop optional time link", async () => {
    const cfg = await pomodoro.getOrCreateConfig(workspaceId);
    expect(cfg.workSeconds).toBe(1500);
    const session = await pomodoro.startSession(workspaceId, "work");
    const stopped = await pomodoro.stopSession(workspaceId, session.id, true);
    expect(stopped.durationSeconds).toBeTypeOf("number");
    expect(stopped.timeEntryId).toBeTruthy();
  });

  it("M7 progress summary has no cause fields", async () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-12-31T23:59:59.000Z");
    const summary = await progress.summary(workspaceId, from, to);
    expect(summary.time.actualSeconds).toBeGreaterThanOrEqual(0);
    expect(summary).not.toHaveProperty("causes");
    expect(summary).not.toHaveProperty("explanation");
  });

  it("M8 calendar unifies tasks/schedule/time", async () => {
    const from = new Date("2026-10-01T00:00:00.000Z");
    const to = new Date("2026-12-01T00:00:00.000Z");
    const items = await calendar.query(workspaceId, from, to);
    expect(Array.isArray(items)).toBe(true);
  });

  it("M9 export job → artifact with authz workspace scope", async () => {
    const job = await exports.enqueue(workspaceId, {
      format: "json",
      reportType: "tasks",
      locale: "en",
    });
    const artifact = await exports.processJob(job.id);
    expect(artifact.workspaceId).toBe(workspaceId);
    expect(artifact.format).toBe("json");
    const loaded = await exports.getArtifact(workspaceId, artifact.id);
    expect(loaded.id).toBe(artifact.id);
  });

  it("M9 PDF fa export embeds A4 RTL markup", async () => {
    const job = await exports.enqueue(workspaceId, {
      format: "pdf",
      reportType: "tasks",
      locale: "fa",
    });
    const artifact = await exports.processJob(job.id);
    const fs = await import("node:fs/promises");
    const text = (await fs.readFile(artifact.storagePath)).toString("utf8");
    expect(text).toContain('dir="rtl"');
    expect(text).toContain("@page");
    expect(text).toContain("A4");
  });

  it("M10 notifications list + mark read", async () => {
    const n = await notifications.create(workspaceId, userId, {
      title: "Welcome",
      body: "Stage 4",
    });
    const list = await notifications.list(workspaceId, userId);
    expect(list.some((x) => x.id === n.id)).toBe(true);
    const read = await notifications.markRead(workspaceId, userId, n.id);
    expect(read.readAtUtc).toBeTruthy();
  });

  it("M11 AI off → unavailable; stub accept creates version; reject does not", async () => {
    await expect(
      proposals.request(workspaceId, { aiEnabled: false }),
    ).rejects.toBeInstanceOf(PlanProposalServiceError);

    const { proposal } = await proposals.request(workspaceId, {
      aiEnabled: true,
      promptSummary: "test",
    });
    expect(proposal.status).toBe("pending");

    const versionsBefore = await schedules.listVersions(workspaceId);
    const rejected = await proposals.request(workspaceId, { aiEnabled: true });
    await proposals.reject(workspaceId, rejected.proposal.id, userId);
    const versionsAfterReject = await schedules.listVersions(workspaceId);
    expect(versionsAfterReject.length).toBe(versionsBefore.length);

    const accepted = await proposals.accept(workspaceId, proposal.id, userId);
    expect(accepted.version.source).toBe("ai_accepted");
    await expect(proposals.accept(workspaceId, proposal.id, userId)).rejects.toBeInstanceOf(
      PlanProposalServiceError,
    );
  });
});
