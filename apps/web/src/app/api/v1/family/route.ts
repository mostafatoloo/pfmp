import { getPrisma, FamilyService, FamilyServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_request, ctx) => {
  const service = new FamilyService(getPrisma());
  const memberships = await service.listFamilyWorkspaces(ctx.userId);
  const pending = await service.listPendingInvitesForEmail(ctx.email);
  return NextResponse.json({
    data: {
      workspaces: memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
      })),
      pendingInvites: pending.map((i) => ({
        id: i.id,
        workspaceName: i.workspace.name,
        email: i.email,
      })),
    },
  });
});

export const POST = withAuth(async (request, ctx) => {
  const body = await readJson(request, z.object({ name: z.string().min(1).max(200) }));
  const service = new FamilyService(getPrisma());
  try {
    const ws = await service.createFamilyWorkspace(ctx.userId, body.name);
    return NextResponse.json(
      { data: { id: ws.id, name: ws.name, kind: ws.kind } },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof FamilyServiceError) {
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    }
    throw err;
  }
});
