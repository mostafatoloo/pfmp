import { getPrisma, PomodoroService, PomodoroServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (req, ctx, params) => {
  let linkTimeEntry = true;
  try {
    const body = (await req.json()) as { linkTimeEntry?: boolean };
    if (typeof body.linkTimeEntry === "boolean") linkTimeEntry = body.linkTimeEntry;
  } catch {
    /* empty body is fine */
  }
  try {
    const row = await new PomodoroService(getPrisma()).stopSession(
      ctx.workspace.id,
      params.id!,
      linkTimeEntry,
    );
    return NextResponse.json({ data: row });
  } catch (err) {
    if (err instanceof PomodoroServiceError) {
      throw new AppError(
        err.code === "NOT_FOUND" ? "NOT_FOUND" : "CONFLICT",
        err.message,
        err.code === "NOT_FOUND" ? 404 : 409,
      );
    }
    throw err;
  }
});
