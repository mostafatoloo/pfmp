import { getPrisma, PomodoroService } from "@pfmp/database";
import { z } from "zod";
import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, z.object({ kind: z.enum(["work", "short_break", "long_break"]) }));
  const row = await new PomodoroService(getPrisma()).startSession(ctx.workspace.id, body.kind);
  return NextResponse.json({ data: row }, { status: 201 });
});
