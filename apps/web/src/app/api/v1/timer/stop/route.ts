import { getPrisma, TimeService, TimeServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (_req, ctx) => {
  try {
    const row = await new TimeService(getPrisma()).stopTimer(ctx.workspace.id);
    return NextResponse.json({ data: row });
  } catch (err) {
    if (err instanceof TimeServiceError)
      throw new AppError("NOT_FOUND", err.message, 404);
    throw err;
  }
});
