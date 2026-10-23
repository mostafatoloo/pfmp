import { getPrisma, TimetableService, TimetableServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const DELETE = withAuth(async (_req, ctx, params) => {
  const id = params.id;
  if (!id) throw new AppError("VALIDATION_ERROR", "Missing id", 400);
  try {
    await new TimetableService(getPrisma()).remove(ctx.workspace.id, id);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof TimetableServiceError) {
      throw new AppError(err.code === "NOT_FOUND" ? "NOT_FOUND" : "VALIDATION_ERROR", err.message, err.code === "NOT_FOUND" ? 404 : 400);
    }
    throw err;
  }
});
