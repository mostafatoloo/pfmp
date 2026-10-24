import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";
import { RecurrenceService } from "../../src/recurrence-service";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("Phase 2 recurrence expansion (SQL Server)", () => {
  let prisma: PrismaClient;
  let recurrence: RecurrenceService;
  let userId: string;
  let workspaceId: string;

  beforeAll(async () => {
    prisma = createPrismaClient(databaseUrl!);
    recurrence = new RecurrenceService(prisma);
    const workspaces = new WorkspaceRepository(prisma);
    await prisma.$connect();

    userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        name: "Recurrence User",
        email: `recur-${userId.slice(0, 8)}@test.com`,
        emailVerified: true,
      },
    });
    workspaceId = (await workspaces.createPersonalWorkspace(userId)).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("expands daily recurrence idempotently", async () => {
    const template = await prisma.task.create({
      data: {
        workspaceId,
        title: "Daily standup",
        status: "planned",
        dueAtUtc: new Date("2026-10-23T09:00:00Z"),
        isRecurrenceTemplate: true,
        recurrenceRuleJson: JSON.stringify({ frequency: "daily" }),
        createdByUserId: userId,
      },
    });

    const first = await recurrence.expandNextOccurrence(workspaceId, template.id);
    expect(first).not.toBeNull();
    expect(first!.dueAtUtc!.toISOString()).toBe("2026-10-24T09:00:00.000Z");
    expect(first!.recurrenceParentId).toBe(template.id);
    expect(first!.isRecurrenceTemplate).toBe(false);

    const second = await recurrence.expandNextOccurrence(workspaceId, template.id);
    expect(second!.id).toBe(first!.id);
  });
});
