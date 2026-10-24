import {
  getPrisma,
  TimetableService,
  TimetableServiceError,
} from "@pfmp/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, ctx) => {
  const settings = await new TimetableService(getPrisma()).getSettings(ctx.workspace.id);
  return NextResponse.json({ data: settings });
});

export const PATCH = withAuth(async (req, ctx) => {
  const body = await readJson(
    req,
    z.object({
      schoolStartMinutes: z.number().int().min(0).max(1439).optional(),
      schoolEndMinutes: z.number().int().min(1).max(1440).optional(),
      schoolWeekPattern: z.enum(["sat_thu", "sat_wed"]).optional(),
      defaultColumnCount: z.number().int().min(1).max(16).optional(),
      dayStartMinutes: z.number().int().min(0).max(1439).optional(),
      dayEndMinutes: z.number().int().min(1).max(1440).optional(),
    }),
  );
  try {
    const settings = await new TimetableService(getPrisma()).upsertSettings(
      ctx.workspace.id,
      body,
    );
    return NextResponse.json({ data: settings });
  } catch (err) {
    if (err instanceof TimetableServiceError) {
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    }
    throw err;
  }
});
