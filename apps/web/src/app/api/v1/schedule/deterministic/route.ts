import { getPrisma, ScheduleService, ScheduleServiceError } from "@pfmp/database";
import { scheduleDeterministicSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, scheduleDeterministicSchema);
  try {
    const out = await new ScheduleService(getPrisma()).runDeterministic(ctx.workspace.id, body);
    return NextResponse.json({ data: out });
  } catch (err) {
    if (err instanceof ScheduleServiceError)
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    throw err;
  }
});
