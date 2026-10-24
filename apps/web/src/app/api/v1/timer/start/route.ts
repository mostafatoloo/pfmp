import { getPrisma, TimeService, TimeServiceError } from "@pfmp/database";
import { timerStartSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, timerStartSchema);
  try {
    const row = await new TimeService(getPrisma()).startTimer(ctx.workspace.id, body);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    if (err instanceof TimeServiceError)
      throw new AppError(
        err.code === "TIMER_ALREADY_RUNNING" ? "TIMER_ALREADY_RUNNING" : "VALIDATION_ERROR",
        err.message,
        err.code === "TIMER_ALREADY_RUNNING" ? 409 : 400,
      );
    throw err;
  }
});
