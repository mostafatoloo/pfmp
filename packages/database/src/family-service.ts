import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";
import {
  canInvite,
  canRemoveMember,
  isFamilyRole,
  hasRoleAtLeast,
  isValidRole,
  type FamilyRole,
  type WorkspaceRole,
} from "./family-roles";

export { hasRoleAtLeast, isValidRole, type FamilyRole, type WorkspaceRole };

export class FamilyServiceError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "VALIDATION"
      | "INVITE_EXPIRED"
      | "INVITE_INVALID",
    message: string,
  ) {
    super(message);
    this.name = "FamilyServiceError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class FamilyService {
  constructor(private readonly prisma: PrismaClient) {}

  async createFamilyWorkspace(userId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new FamilyServiceError("VALIDATION", "Name required");
    return this.prisma.workspace.create({
      data: {
        name: trimmed,
        kind: "family",
        members: { create: { userId, role: "owner" } },
      },
    });
  }

  listFamilyWorkspaces(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: {
        userId,
        deletedAtUtc: null,
        workspace: { kind: "family", deletedAtUtc: null },
      },
      include: { workspace: true },
      orderBy: { createdAtUtc: "asc" },
    });
  }

  async getMembership(userId: string, workspaceId: string) {
    return this.prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId,
        deletedAtUtc: null,
        workspace: { deletedAtUtc: null },
      },
      include: { workspace: true },
    });
  }

  async requireRole(userId: string, workspaceId: string): Promise<FamilyRole> {
    const m = await this.getMembership(userId, workspaceId);
    if (!m || !isFamilyRole(m.role)) {
      throw new FamilyServiceError("FORBIDDEN", "Not a workspace member");
    }
    return m.role;
  }

  listMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId, deletedAtUtc: null },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async invite(
    workspaceId: string,
    invitedByUserId: string,
    email: string,
    role: FamilyRole = "member",
    ttlHours = 72,
  ) {
    const actorRole = await this.requireRole(invitedByUserId, workspaceId);
    if (!canInvite(actorRole)) {
      throw new FamilyServiceError("FORBIDDEN", "Cannot invite");
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized) throw new FamilyServiceError("VALIDATION", "Email required");
    if (role === "owner") {
      throw new FamilyServiceError("VALIDATION", "Cannot invite as owner");
    }

    const token = randomBytes(24).toString("base64url");
    const invite = await this.prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: normalized,
        role,
        tokenHash: hashToken(token),
        expiresAtUtc: new Date(Date.now() + ttlHours * 3600_000),
        invitedByUserId,
      },
    });
    return { invite, token };
  }

  listPendingInvitesForEmail(email: string) {
    const now = utcNow();
    return this.prisma.workspaceInvite.findMany({
      where: {
        email: email.trim().toLowerCase(),
        acceptedAtUtc: null,
        declinedAtUtc: null,
        expiresAtUtc: { gt: now },
      },
      include: { workspace: true },
    });
  }

  async acceptInvite(inviteId: string, userId: string, userEmail: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite || invite.declinedAtUtc || invite.acceptedAtUtc) {
      throw new FamilyServiceError("INVITE_INVALID", "Invitation invalid");
    }
    if (invite.expiresAtUtc.getTime() < Date.now()) {
      throw new FamilyServiceError("INVITE_EXPIRED", "Invitation expired");
    }
    if (invite.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
      throw new FamilyServiceError("FORBIDDEN", "Invitation email mismatch");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.workspaceInvite.update({
        where: { id: inviteId },
        data: { acceptedAtUtc: utcNow() },
      });
      const existing = await tx.workspaceMember.findFirst({
        where: { workspaceId: invite.workspaceId, userId, deletedAtUtc: null },
      });
      if (existing) return existing;
      return tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
        },
      });
    });
  }

  async declineInvite(inviteId: string, userEmail: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite || invite.acceptedAtUtc || invite.declinedAtUtc) {
      throw new FamilyServiceError("INVITE_INVALID", "Invitation invalid");
    }
    if (invite.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
      throw new FamilyServiceError("FORBIDDEN", "Invitation email mismatch");
    }
    return this.prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { declinedAtUtc: utcNow() },
    });
  }

  async removeMember(workspaceId: string, actorUserId: string, targetUserId: string) {
    const actorRole = await this.requireRole(actorUserId, workspaceId);
    const target = await this.getMembership(targetUserId, workspaceId);
    if (!target || !isFamilyRole(target.role)) {
      throw new FamilyServiceError("NOT_FOUND", "Member not found");
    }
    if (!canRemoveMember(actorRole, target.role)) {
      throw new FamilyServiceError("FORBIDDEN", "Cannot remove member");
    }
    return this.prisma.workspaceMember.update({
      where: { id: target.id },
      data: { deletedAtUtc: utcNow() },
    });
  }

  async leave(workspaceId: string, userId: string) {
    const m = await this.getMembership(userId, workspaceId);
    if (!m) throw new FamilyServiceError("NOT_FOUND", "Membership not found");
    if (m.role === "owner") {
      throw new FamilyServiceError("FORBIDDEN", "Owner cannot leave; transfer ownership first");
    }
    return this.prisma.workspaceMember.update({
      where: { id: m.id },
      data: { deletedAtUtc: utcNow() },
    });
  }
}
