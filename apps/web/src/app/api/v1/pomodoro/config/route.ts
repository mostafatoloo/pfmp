import { getPrisma, PomodoroService } from "@pfmp/database";
import { z } from "zod";
import { NextResponse } from "next/server";
import { readJson, withAuth } from "@/lib/api-handler";

const patchSchema = z.object({
  workSeconds: z.number().int().positive().optional(),
  shortBreakSeconds: z.number().int().positive().optional(),
  longBreakSeconds: z.number().int().positive().optional(),
  longBreakEvery: z.number().int().positive().optional(),
});

export const GET = withAuth(async (_req, ctx) => {
  const cfg = await new PomodoroService(getPrisma()).getOrCreateConfig(ctx.workspace.id);
  return NextResponse.json({ data: cfg });
});

export const PATCH = withAuth(async (req, ctx) => {
  const body = await readJson(req, patchSchema);
  const cfg = await new PomodoroService(getPrisma()).updateConfig(ctx.workspace.id, body);
  return NextResponse.json({ data: cfg });
});
