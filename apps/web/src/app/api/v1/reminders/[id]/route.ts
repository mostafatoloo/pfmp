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

export const PATCH = withAuth(async (req, ctx, params) => {
  const id = params.id;
  if (!id) throw new AppError("VALIDATION_ERROR", "Missing id", 400);
  const body = await readJson(
    req,
    z.object({
      title: z.string().min(1).max(300).optional(),
      notes: z.string().max(5000).nullable().optional(),
      remindAtUtc: z.string().datetime().optional(),
    }),
  );
  try {
    const row = await new ReminderService(getPrisma()).update(ctx.workspace.id, ctx.userId, id, {
      title: body.title,
      notes: body.notes,
      remindAtUtc: body.remindAtUtc ? new Date(body.remindAtUtc) : undefined,
    });
    return NextResponse.json({ data: serialize(row) });
  } catch (err) {
    if (err instanceof ReminderServiceError) {
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
    await new ReminderService(getPrisma()).remove(ctx.workspace.id, ctx.userId, id);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof ReminderServiceError) {
      throw new AppError(
        err.code === "NOT_FOUND" ? "NOT_FOUND" : "VALIDATION_ERROR",
        err.message,
        err.code === "NOT_FOUND" ? 404 : 400,
      );
    }
    throw err;
  }
});
