import { getPrisma, ScheduleService, ScheduleServiceError } from "@pfmp/database";
import { scheduleVersionCreateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function mapErr(err: unknown): never {
  if (err instanceof ScheduleServiceError)
    throw new AppError(err.code === "NOT_FOUND" ? "NOT_FOUND" : err.code === "CONFLICT" ? "CONFLICT" : "VALIDATION_ERROR", err.message, err.code === "NOT_FOUND" ? 404 : 400);
  throw err;
}

export const GET = withAuth(async (_req, ctx) => {
  const rows = await new ScheduleService(getPrisma()).listVersions(ctx.workspace.id);
  return NextResponse.json({ data: rows });
});

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, scheduleVersionCreateSchema);
  try {
    const version = await new ScheduleService(getPrisma()).createVersion(ctx.workspace.id, {
      label: body.label,
      source: body.source,
      supersedePrevious: body.supersedePrevious,
      items: body.items.map((i) => ({
        title: i.title,
        startsAtUtc: new Date(i.startsAtUtc),
        endsAtUtc: new Date(i.endsAtUtc),
        durationSeconds: i.durationSeconds,
      })),
    });
    return NextResponse.json({ data: version }, { status: 201 });
  } catch (err) {
    mapErr(err);
  }
});
