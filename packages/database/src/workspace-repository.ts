import type { PrismaClient } from "./client";

export type PersonalWorkspace = {
  id: string;
  name: string;
  kind: string;
};

export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createPersonalWorkspace(userId: string, name = "Personal"): Promise<PersonalWorkspace> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.workspaceMember.findFirst({
        where: {
          userId,
          deletedAtUtc: null,
          role: "owner",
          workspace: { kind: "personal", deletedAtUtc: null },
        },
        include: { workspace: true },
      });
      if (existing) {
        return {
          id: existing.workspace.id,
          name: existing.workspace.name,
          kind: existing.workspace.kind,
        };
      }

      const workspace = await tx.workspace.create({
        data: {
          name,
          kind: "personal",
          members: {
            create: {
              userId,
              role: "owner",
            },
          },
        },
      });

      return { id: workspace.id, name: workspace.name, kind: workspace.kind };
    });
  }

  async getPersonalWorkspace(userId: string): Promise<PersonalWorkspace | null> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        userId,
        deletedAtUtc: null,
        role: "owner",
        workspace: { kind: "personal", deletedAtUtc: null },
      },
      include: { workspace: true },
    });
    if (!membership) return null;
    return {
      id: membership.workspace.id,
      name: membership.workspace.name,
      kind: membership.workspace.kind,
    };
  }

  async assertWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId,
        deletedAtUtc: null,
        workspace: { deletedAtUtc: null },
      },
    });
    return Boolean(membership);
  }
}
