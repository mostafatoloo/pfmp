import { getPrisma, ProjectService, ProjectServiceError } from "@pfmp/database";
import { activityUpdateSchema } from "@pfmp/api-contracts";
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
    const row = await new ProjectService(getPrisma()).getActivity(
      ctx.workspace.id,
      params.id!,
      params.activityId!,
    );
    return NextResponse.json({ data: serialize(row) });
  } catch (err) {
    mapErr(err);
  }
});

export const PATCH = withAuth(async (request, ctx, params) => {
  const body = await readJson(request, activityUpdateSchema);
  try {
    const row = await new ProjectService(getPrisma()).updateActivity(
      ctx.workspace.id,
      params.id!,
      params.activityId!,
      body,
    );
    return NextResponse.json({ data: serialize(row) });
  } catch (err) {
    mapErr(err);
  }
});

export const DELETE = withAuth(async (_request, ctx, params) => {
  try {
    await new ProjectService(getPrisma()).softDeleteActivity(
      ctx.workspace.id,
      params.id!,
      params.activityId!,
    );
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    mapErr(err);
  }
});
