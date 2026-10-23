import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";
import { TaskService, TaskServiceError } from "../../src/task-service";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true";

describe("M1 tasks (SQL Server)", () => {
  let prisma: PrismaClient;
  let workspaces: WorkspaceRepository;
  let tasks: TaskService;
  let userId: string;
  let workspaceId: string;
  let otherWorkspaceId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = createPrismaClient(databaseUrl);
    workspaces = new WorkspaceRepository(prisma);
    tasks = new TaskService(prisma);
    await prisma.$connect();

    userId = randomUUID();
    const otherUser = randomUUID();
    await prisma.user.createMany({
      data: [
        {
          id: userId,
          name: "Task Owner",
          email: `tasks-${userId.slice(0, 8)}@example.com`,
          emailVerified: true,
        },
        {
          id: otherUser,
          name: "Other",
          email: `tasks-o-${otherUser.slice(0, 8)}@example.com`,
          emailVerified: true,
        },
      ],
    });
    workspaceId = (await workspaces.createPersonalWorkspace(userId)).id;
    otherWorkspaceId = (await workspaces.createPersonalWorkspace(otherUser)).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("captures inbox task and lists it", async () => {
    const created = await tasks.create(workspaceId, userId, { title: "Buy milk" });
    expect(created.status).toBe("inbox");
    const list = await tasks.list(workspaceId, { q: "milk" });
    expect(list.some((t) => t.id === created.id)).toBe(true);
  });

  it("reschedule preserves originalDueAtUtc and writes history", async () => {
    const firstDue = new Date("2026-11-01T10:00:00.000Z");
    const secondDue = new Date("2026-11-05T10:00:00.000Z");
    const created = await tasks.create(workspaceId, userId, {
      title: "Essay draft",
      status: "planned",
      dueAtUtc: firstDue,
    });
    expect(created.originalDueAtUtc?.toISOString()).toBe(firstDue.toISOString());

    const updated = await tasks.update(workspaceId, created.id, userId, {
      dueAtUtc: secondDue,
    });
    expect(updated.dueAtUtc?.toISOString()).toBe(secondDue.toISOString());
    expect(updated.originalDueAtUtc?.toISOString()).toBe(firstDue.toISOString());

    const history = await tasks.history(workspaceId, created.id);
    expect(history.some((h) => h.eventType === "rescheduled")).toBe(true);
  });

  it("rejects invalid status transition", async () => {
    const created = await tasks.create(workspaceId, userId, { title: "Done soon" });
    await tasks.update(workspaceId, created.id, userId, { status: "planned" });
    await tasks.update(workspaceId, created.id, userId, { status: "in_progress" });
    await tasks.update(workspaceId, created.id, userId, { status: "completed" });
    await expect(
      tasks.update(workspaceId, created.id, userId, { status: "inbox" }),
    ).rejects.toBeInstanceOf(TaskServiceError);
  });

  it("overdue and upcoming presets", async () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);
    const overdue = await tasks.create(workspaceId, userId, {
      title: "Overdue item",
      status: "planned",
      dueAtUtc: past,
    });
    const upcoming = await tasks.create(workspaceId, userId, {
      title: "Upcoming item",
      status: "planned",
      dueAtUtc: future,
    });
    const overdueList = await tasks.list(workspaceId, { preset: "overdue" });
    const upcomingList = await tasks.list(workspaceId, { preset: "upcoming" });
    expect(overdueList.some((t) => t.id === overdue.id)).toBe(true);
    expect(upcomingList.some((t) => t.id === upcoming.id)).toBe(true);
  });

  it("cannot read task from another workspace", async () => {
    const foreign = await tasks.create(otherWorkspaceId, userId, { title: "Secret" });
    await expect(tasks.get(workspaceId, foreign.id)).rejects.toBeInstanceOf(TaskServiceError);
  });
});
