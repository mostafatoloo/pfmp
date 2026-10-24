import { getPrisma, TimeService, TimeServiceError } from "@pfmp/database";
import { timeEntryCreateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const rows = await new TimeService(getPrisma()).listEntries(
    ctx.workspace.id,
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined,
  );
  return NextResponse.json({
    data: rows.map((e) => ({
      ...e,
      startedAtUtc: e.startedAtUtc.toISOString(),
      endedAtUtc: e.endedAtUtc?.toISOString() ?? null,
    })),
  });
});

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, timeEntryCreateSchema);
  try {
    const row = await new TimeService(getPrisma()).createManual(ctx.workspace.id, {
      startedAtUtc: new Date(body.startedAtUtc),
      endedAtUtc: new Date(body.endedAtUtc),
      taskId: body.taskId,
      projectId: body.projectId,
      note: body.note,
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    if (err instanceof TimeServiceError)
      throw new AppError(err.code === "NOT_FOUND" ? "NOT_FOUND" : "VALIDATION_ERROR", err.message, 400);
    throw err;
  }
});
