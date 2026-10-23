import { getPrisma, WorkspaceRepository, type PersonalWorkspace } from "@pfmp/database";
import { getAuth } from "./auth";

export class AuthzError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "WORKSPACE_MISMATCH",
    readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "AuthzError";
  }
}

export type AuthedContext = {
  userId: string;
  email: string;
  name: string;
  timezone: string;
  locale: string;
  workspace: PersonalWorkspace;
};

export type WorkspaceContext = AuthedContext & {
  /** The active workspace (may differ from personal). */
  activeWorkspace: { id: string; name: string; kind: string; role: string };
};

/**
 * Resolve session → personal workspace. Never trust client-supplied workspaceId for authz.
 */
export async function requireWorkspace(headers: Headers): Promise<AuthedContext> {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    throw new AuthzError("Authentication required", "UNAUTHORIZED", 401);
  }

  const workspaces = new WorkspaceRepository(getPrisma());
  let workspace = await workspaces.getPersonalWorkspace(session.user.id);
  if (!workspace) {
    workspace = await workspaces.createPersonalWorkspace(
      session.user.id,
      session.user.name || "Personal",
    );
  }

  const user = session.user as {
    id: string;
    email: string;
    name: string;
    timezone?: string;
    locale?: string;
  };

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone ?? "UTC",
    locale: user.locale ?? "en",
    workspace,
  };
}

/**
 * Resolve session then verify the caller is a member of the given workspaceId.
 * Returns the workspace context with the user's role in that workspace.
 */
export async function requireWorkspaceAccess(
  headers: Headers,
  workspaceId: string,
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace(headers);
  const prisma = getPrisma();

  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId: ctx.userId,
      workspaceId,
      deletedAtUtc: null,
      workspace: { deletedAtUtc: null },
    },
    include: { workspace: true },
  });

  if (!member) {
    throw new AuthzError("Not a member of this workspace", "FORBIDDEN", 403);
  }

  return {
    ...ctx,
    activeWorkspace: {
      id: member.workspace.id,
      name: member.workspace.name,
      kind: member.workspace.kind,
      role: member.role,
    },
  };
}

/**
 * List all workspaces the authenticated user is a member of.
 */
export async function listUserWorkspaces(
  headers: Headers,
): Promise<Array<{ id: string; name: string; kind: string; role: string }>> {
  const ctx = await requireWorkspace(headers);
  const prisma = getPrisma();

  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId: ctx.userId,
      deletedAtUtc: null,
      workspace: { deletedAtUtc: null },
    },
    include: { workspace: true },
    orderBy: { createdAtUtc: "asc" },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    kind: m.workspace.kind,
    role: m.role,
  }));
}

/**
 * Resolve the active workspace from the X-PFMP-Workspace-Id header or
 * pfmp_workspace_id cookie. Falls back to the personal workspace.
 * Validates membership before returning.
 */
export async function resolveActiveWorkspace(headers: Headers): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace(headers);

  const explicitId =
    headers.get("x-pfmp-workspace-id") ?? parseCookieValue(headers, "pfmp_workspace_id");

  if (!explicitId || explicitId === ctx.workspace.id) {
    return {
      ...ctx,
      activeWorkspace: {
        id: ctx.workspace.id,
        name: ctx.workspace.name,
        kind: ctx.workspace.kind,
        role: "owner",
      },
    };
  }

  return requireWorkspaceAccess(headers, explicitId);
}

/** Ensure a resource belongs to the caller's personal workspace. */
export function assertSameWorkspace(
  ctx: AuthedContext,
  resourceWorkspaceId: string,
): void {
  if (resourceWorkspaceId !== ctx.workspace.id) {
    throw new AuthzError("Workspace mismatch", "WORKSPACE_MISMATCH", 403);
  }
}

function parseCookieValue(headers: Headers, name: string): string | null {
  const cookie = headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ?? null;
}
