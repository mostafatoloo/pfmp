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

/** Replace school classes for one weekday from an ordered subject list. */
export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(
    req,
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      subjects: z.array(z.string().min(1).max(300)).min(1).max(16),
      schoolStartMinutes: z.number().int().min(0).max(1439).optional(),
      schoolEndMinutes: z.number().int().min(1).max(1440).optional(),
    }),
  );
  const service = new TimetableService(getPrisma());
  try {
    const settings = await service.getSettings(ctx.workspace.id);
    const created = await service.applySchoolDaySubjects(
      ctx.workspace.id,
      body.dayOfWeek,
      body.subjects,
      body.schoolStartMinutes ?? settings.schoolStartMinutes,
      body.schoolEndMinutes ?? settings.schoolEndMinutes,
    );
    return NextResponse.json({ data: created.map(serialize) }, { status: 201 });
  } catch (err) {
    if (err instanceof TimetableServiceError) {
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    }
    throw err;
  }
});
