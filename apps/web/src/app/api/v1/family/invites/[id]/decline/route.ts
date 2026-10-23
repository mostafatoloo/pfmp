import { getPrisma, FamilyService, FamilyServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (_request, ctx, params) => {
  const inviteId = params.id;
  if (!inviteId) throw new AppError("VALIDATION_ERROR", "Missing invite id", 400);
  const service = new FamilyService(getPrisma());
  try {
    await service.declineInvite(inviteId, ctx.email);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof FamilyServiceError) {
      throw new AppError(
        err.code === "FORBIDDEN" ? "FORBIDDEN" : "VALIDATION_ERROR",
        err.message,
        err.code === "FORBIDDEN" ? 403 : 400,
      );
    }
    throw err;
  }
});
