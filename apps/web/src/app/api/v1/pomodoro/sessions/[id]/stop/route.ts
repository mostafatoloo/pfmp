import { getPrisma, PomodoroService, PomodoroServiceError } from "@pfmp/database";
import { z } from "zod";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (req, ctx, params) => {
  const body = await readJson(req, z.object({ linkTimeEntry: z.boolean().optional() }).partial());
  try {
    const row = await new PomodoroService(getPrisma()).stopSession(
      ctx.workspace.id,
      params.id!,
      body.linkTimeEntry ?? false,
    );
    return NextResponse.json({ data: row });
  } catch (err) {
    if (err instanceof PomodoroServiceError)
      throw new AppError(err.code === "NOT_FOUND" ? "NOT_FOUND" : "CONFLICT", err.message, err.code === "NOT_FOUND" ? 404 : 409);
    throw err;
  }
});
