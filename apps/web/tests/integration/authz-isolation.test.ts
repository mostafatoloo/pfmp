import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPrismaClient,
  WorkspaceRepository,
  type PrismaClient,
} from "@pfmp/database";
import { assertSameWorkspace, AuthzError, type AuthedContext } from "@pfmp/auth";

/**
 * API-layer authz smoke: User A's context cannot claim User B's workspace id.
 * Full HTTP session cookie flow is covered once magic-link e2e lands; this proves
 * requireWorkspace/assertSameWorkspace isolation rules against SQL Server data.
 */
describe("API authz isolation", () => {
  let prisma: PrismaClient;
  let workspaces: WorkspaceRepository;

  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    process.env.DATABASE_URL ??
    "sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true";

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = createPrismaClient(databaseUrl);
    workspaces = new WorkspaceRepository(prisma);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects cross-workspace assertSameWorkspace", async () => {
    const userA = randomUUID();
    const userB = randomUUID();
    await prisma.user.createMany({
      data: [
        {
          id: userA,
          name: "A",
          email: `authz-a-${userA.slice(0, 8)}@example.com`,
          emailVerified: true,
        },
        {
          id: userB,
          name: "B",
          email: `authz-b-${userB.slice(0, 8)}@example.com`,
          emailVerified: true,
        },
      ],
    });
    const wsA = await workspaces.createPersonalWorkspace(userA);
    const wsB = await workspaces.createPersonalWorkspace(userB);

    const ctxA: AuthedContext = {
      userId: userA,
      email: `authz-a-${userA.slice(0, 8)}@example.com`,
      name: "A",
      timezone: "UTC",
      locale: "en",
      workspace: wsA,
    };

    expect(() => assertSameWorkspace(ctxA, wsA.id)).not.toThrow();
    expect(() => assertSameWorkspace(ctxA, wsB.id)).toThrow(AuthzError);

    const access = await workspaces.assertWorkspaceAccess(userA, wsB.id);
    expect(access).toBe(false);
  });
});
