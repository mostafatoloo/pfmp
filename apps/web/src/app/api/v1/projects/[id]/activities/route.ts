import { getPrisma, ProjectService, ProjectServiceError } from "@pfmp/database";
import { activityCreateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function serialize(a: {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  notes: string | null;
  createdAtUtc: Date;
  updatedAtUtc: Date;
}) {
  return {
    id: a.id,
    workspaceId: a.workspaceId,
    projectId: a.projectId,
    name: a.name,
    notes: a.notes,
    createdAtUtc: a.createdAtUtc.toISOString(),
    updatedAtUtc: a.updatedAtUtc.toISOString(),
  };
}

function mapErr(err: unknown): never {
  if (err instanceof ProjectServiceError) {
    throw new AppError(err.code, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  }
  throw err;
}

export const GET = withAuth(async (_request, ctx, params) => {
  try {
    const rows = await new ProjectService(getPrisma()).listActivities(
      ctx.workspace.id,
      params.id!,
    );
    return NextResponse.json({ data: rows.map(serialize) });
  } catch (err) {
    mapErr(err);
  }
});

export const POST = withAuth(async (request, ctx, params) => {
  const body = await readJson(request, activityCreateSchema);
  try {
    const row = await new ProjectService(getPrisma()).createActivity(
      ctx.workspace.id,
      params.id!,
      body,
    );
    return NextResponse.json({ data: serialize(row) }, { status: 201 });
  } catch (err) {
    mapErr(err);
  }
});
