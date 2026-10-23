import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";
import { ProjectService, ProjectServiceError } from "../../src/project-service";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "sqlserver://localhost:1433;database=pfmp_test;user=sa;password=Your_strong_Password123;encrypt=true;trustServerCertificate=true";

describe("M2 projects/activities (SQL Server)", () => {
  let prisma: PrismaClient;
  let workspaces: WorkspaceRepository;
  let projects: ProjectService;
  let workspaceId: string;
  let otherWorkspaceId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = createPrismaClient(databaseUrl);
    workspaces = new WorkspaceRepository(prisma);
    projects = new ProjectService(prisma);
    await prisma.$connect();
    const userA = randomUUID();
    const userB = randomUUID();
    await prisma.user.createMany({
      data: [
        { id: userA, name: "A", email: `proj-a-${userA.slice(0, 8)}@example.com`, emailVerified: true },
        { id: userB, name: "B", email: `proj-b-${userB.slice(0, 8)}@example.com`, emailVerified: true },
      ],
    });
    workspaceId = (await workspaces.createPersonalWorkspace(userA)).id;
    otherWorkspaceId = (await workspaces.createPersonalWorkspace(userB)).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("CRUD project with billable flag and nested activity", async () => {
    const project = await projects.create(workspaceId, {
      name: "Consulting",
      billable: true,
    });
    expect(project.billable).toBe(true);
    const activity = await projects.createActivity(workspaceId, project.id, {
      name: "Discovery call",
    });
    const listed = await projects.listActivities(workspaceId, project.id);
    expect(listed.map((a) => a.id)).toContain(activity.id);
    await projects.softDeleteActivity(workspaceId, project.id, activity.id);
    await projects.softDelete(workspaceId, project.id);
    await expect(projects.get(workspaceId, project.id)).rejects.toBeInstanceOf(ProjectServiceError);
  });

  it("isolates projects across workspaces", async () => {
    const foreign = await projects.create(otherWorkspaceId, { name: "Other" });
    await expect(projects.get(workspaceId, foreign.id)).rejects.toBeInstanceOf(ProjectServiceError);
  });
});
