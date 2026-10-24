import { getPrisma, TimetableService, TimetableServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function serialize(row: {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  classType: string | null;
  notes: string | null;
}) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    dayOfWeek: row.dayOfWeek,
    startMinutes: row.startMinutes,
    endMinutes: row.endMinutes,
    classType: row.classType,
    notes: row.notes,
  };
}

export const PATCH = withAuth(async (req, ctx, params) => {
  const id = params.id;
  if (!id) throw new AppError("VALIDATION_ERROR", "Missing id", 400);
  const body = await readJson(
    req,
    z.object({
      kind: z.enum(["school_class", "study_session", "other_class"]).optional(),
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(500).nullable().optional(),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
      startMinutes: z.number().int().min(0).max(1439).optional(),
      endMinutes: z.number().int().min(1).max(1440).optional(),
      classType: z.string().max(100).nullable().optional(),
      notes: z.string().max(5000).nullable().optional(),
    }),
  );
  try {
    const row = await new TimetableService(getPrisma()).update(ctx.workspace.id, id, body);
    return NextResponse.json({ data: serialize(row) });
  } catch (err) {
    if (err instanceof TimetableServiceError) {
      throw new AppError(
        err.code === "NOT_FOUND" ? "NOT_FOUND" : "VALIDATION_ERROR",
        err.message,
        err.code === "NOT_FOUND" ? 404 : 400,
      );
    }
    throw err;
  }
});

export const DELETE = withAuth(async (_req, ctx, params) => {
  const id = params.id;
  if (!id) throw new AppError("VALIDATION_ERROR", "Missing id", 400);
  try {
    await new TimetableService(getPrisma()).remove(ctx.workspace.id, id);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof TimetableServiceError) {
      throw new AppError(
        err.code === "NOT_FOUND" ? "NOT_FOUND" : "VALIDATION_ERROR",
        err.message,
        err.code === "NOT_FOUND" ? 404 : 400,
      );
    }
    throw err;
  }
});
