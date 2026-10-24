import { getPrisma, ReminderService, ReminderServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function serialize(row: {
  id: string;
  title: string;
  notes: string | null;
  remindAtUtc: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    remindAtUtc: row.remindAtUtc.toISOString(),
  };
}

export const GET = withAuth(async (_req, ctx) => {
  const rows = await new ReminderService(getPrisma()).list(ctx.workspace.id, ctx.userId);
  return NextResponse.json({ data: rows.map(serialize) });
});

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(
    req,
    z.object({
      title: z.string().min(1).max(300),
      notes: z.string().max(5000).nullable().optional(),
      remindAtUtc: z.string().datetime(),
    }),
  );
  try {
    const row = await new ReminderService(getPrisma()).create(ctx.workspace.id, ctx.userId, {
      title: body.title,
      notes: body.notes,
      remindAtUtc: new Date(body.remindAtUtc),
    });
    return NextResponse.json({ data: serialize(row) }, { status: 201 });
  } catch (err) {
    if (err instanceof ReminderServiceError) {
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    }
    throw err;
  }
});
