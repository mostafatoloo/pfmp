import { getPrisma, PomodoroService, PomodoroServiceError } from "@pfmp/database";
import { z } from "zod";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(
    req,
    z.object({
      kind: z.enum(["work", "short_break", "long_break"]),
      taskId: z.string().uuid().nullable().optional(),
    }),
  );
  try {
    const row = await new PomodoroService(getPrisma()).startSession(ctx.workspace.id, body.kind, {
      taskId: body.taskId,
      userId: ctx.userId,
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    if (err instanceof PomodoroServiceError) {
      throw new AppError(
        err.code === "CONFLICT" ? "CONFLICT" : "VALIDATION_ERROR",
        err.message,
        err.code === "CONFLICT" ? 409 : 400,
      );
    }
    throw err;
  }
});
