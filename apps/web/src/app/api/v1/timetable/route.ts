import {
  getPrisma,
  TimetableService,
  TimetableServiceError,
} from "@pfmp/database";
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

export const GET = withAuth(async (_req, ctx) => {
  const service = new TimetableService(getPrisma());
  const [rows, settings] = await Promise.all([
    service.list(ctx.workspace.id),
    service.getSettings(ctx.workspace.id),
  ]);
  return NextResponse.json({ data: { slots: rows.map(serialize), settings } });
});

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(
    req,
    z.object({
      kind: z.enum(["school_class", "study_session", "other_class"]),
      title: z.string().min(1).max(300),
      description: z.string().max(500).nullable().optional(),
      dayOfWeek: z.number().int().min(0).max(6),
      startMinutes: z.number().int().min(0).max(1439),
      endMinutes: z.number().int().min(1).max(1440),
      classType: z.string().max(100).nullable().optional(),
      notes: z.string().max(5000).nullable().optional(),
    }),
  );
  try {
    const row = await new TimetableService(getPrisma()).create(ctx.workspace.id, body);
    return NextResponse.json({ data: serialize(row) }, { status: 201 });
  } catch (err) {
    if (err instanceof TimetableServiceError) {
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    }
    throw err;
  }
});
