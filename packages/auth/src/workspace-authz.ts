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
    // Recover if hook failed historically
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

/** Ensure a resource belongs to the caller's personal workspace. */
export function assertSameWorkspace(
  ctx: AuthedContext,
  resourceWorkspaceId: string,
): void {
  if (resourceWorkspaceId !== ctx.workspace.id) {
    throw new AuthzError("Workspace mismatch", "WORKSPACE_MISMATCH", 403);
  }
}
