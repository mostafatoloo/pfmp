import { getPrisma, FamilyService, FamilyServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (_request, ctx, params) => {
  const inviteId = params.id;
  if (!inviteId) throw new AppError("VALIDATION_ERROR", "Missing invite id", 400);
  const service = new FamilyService(getPrisma());
  try {
    const membership = await service.acceptInvite(inviteId, ctx.userId, ctx.email);
    return NextResponse.json({ data: { workspaceId: membership.workspaceId, role: membership.role } });
  } catch (err) {
    if (err instanceof FamilyServiceError) {
      const status =
        err.code === "FORBIDDEN" ? 403 : err.code === "INVITE_EXPIRED" ? 410 : 400;
      throw new AppError(
        err.code === "FORBIDDEN" ? "FORBIDDEN" : "VALIDATION_ERROR",
        err.message,
        status,
      );
    }
    throw err;
  }
});
