import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true";

describe("workspace isolation (SQL Server)", () => {
  let prisma: PrismaClient;
  let workspaces: WorkspaceRepository;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = createPrismaClient(databaseUrl);
    workspaces = new WorkspaceRepository(prisma);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates personal workspace on signup bootstrap", async () => {
    const userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        name: "Alice",
        email: `alice-${userId.slice(0, 8)}@example.com`,
        emailVerified: true,
      },
    });

    const ws = await workspaces.createPersonalWorkspace(userId, "Alice Personal");
    expect(ws.kind).toBe("personal");

    const again = await workspaces.createPersonalWorkspace(userId);
    expect(again.id).toBe(ws.id);

    const loaded = await workspaces.getPersonalWorkspace(userId);
    expect(loaded?.id).toBe(ws.id);
  });

  it("User A cannot read User B workspace-scoped tasks", async () => {
    const userA = randomUUID();
    const userB = randomUUID();

    await prisma.user.createMany({
      data: [
        {
          id: userA,
          name: "User A",
          email: `a-${userA.slice(0, 8)}@example.com`,
          emailVerified: true,
        },
        {
          id: userB,
          name: "User B",
          email: `b-${userB.slice(0, 8)}@example.com`,
          emailVerified: true,
        },
      ],
    });

    const wsA = await workspaces.createPersonalWorkspace(userA, "A");
    const wsB = await workspaces.createPersonalWorkspace(userB, "B");

    const taskB = await prisma.task.create({
      data: {
        workspaceId: wsB.id,
        title: "Secret B task",
        status: "inbox",
      },
    });

    // Authz: resolve caller's workspace, then query with that scope only
    const aCanAccessB = await workspaces.assertWorkspaceAccess(userA, wsB.id);
    expect(aCanAccessB).toBe(false);

    const leaked = await prisma.task.findFirst({
      where: {
        id: taskB.id,
        workspaceId: wsA.id,
        deletedAtUtc: null,
      },
    });
    expect(leaked).toBeNull();

    const owned = await prisma.task.findFirst({
      where: {
        id: taskB.id,
        workspaceId: wsB.id,
        deletedAtUtc: null,
      },
    });
    expect(owned?.title).toBe("Secret B task");
  });
});
