import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";
import { FamilyService, FamilyServiceError } from "../../src/family-service";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("Phase 2 family workspace (SQL Server)", () => {
  let prisma: PrismaClient;
  let family: FamilyService;
  let ownerUserId: string;
  let memberUserId: string;
  let memberEmail: string;
  let familyWorkspaceId: string;

  beforeAll(async () => {
    prisma = createPrismaClient(databaseUrl!);
    family = new FamilyService(prisma);
    await prisma.$connect();

    ownerUserId = randomUUID();
    memberUserId = randomUUID();
    memberEmail = `fam-member-${memberUserId.slice(0, 8)}@test.com`;
    await prisma.user.createMany({
      data: [
        {
          id: ownerUserId,
          name: "Family Owner",
          email: `fam-owner-${ownerUserId.slice(0, 8)}@test.com`,
          emailVerified: true,
        },
        {
          id: memberUserId,
          name: "Family Member",
          email: memberEmail,
          emailVerified: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a family workspace and owner is added", async () => {
    const ws = await family.createFamilyWorkspace(ownerUserId, "Smith Family");
    familyWorkspaceId = ws.id;
    expect(ws.kind).toBe("family");
    expect(ws.name).toBe("Smith Family");

    const members = await family.listMembers(familyWorkspaceId);
    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe("owner");
  });

  it("invites and accepts a member", async () => {
    const { invite, token } = await family.invite(
      familyWorkspaceId,
      ownerUserId,
      memberEmail,
    );
    expect(invite.role).toBe("member");

    await family.acceptInvite(invite.id, memberUserId, memberEmail);
    const members = await family.listMembers(familyWorkspaceId);
    expect(members).toHaveLength(2);
  });

  it("member cannot invite (requires admin)", async () => {
    await expect(
      family.invite(familyWorkspaceId, memberUserId, "another@test.com"),
    ).rejects.toBeInstanceOf(FamilyServiceError);
  });

  it("owner cannot be removed", async () => {
    await expect(
      family.removeMember(familyWorkspaceId, ownerUserId, ownerUserId),
    ).rejects.toThrow();
  });

  it("member can leave", async () => {
    await family.leave(familyWorkspaceId, memberUserId);
    const members = await family.listMembers(familyWorkspaceId);
    expect(members).toHaveLength(1);
  });
});
