import { getPrisma, ScheduleService, ScheduleServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, ctx, params) => {
  try {
    const version = await new ScheduleService(getPrisma()).getVersion(ctx.workspace.id, params.id!);
    return NextResponse.json({ data: version });
  } catch (err) {
    if (err instanceof ScheduleServiceError)
      throw new AppError("NOT_FOUND", err.message, 404);
    throw err;
  }
});
