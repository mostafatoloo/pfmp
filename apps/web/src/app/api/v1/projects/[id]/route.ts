import { getPrisma, ProjectService, ProjectServiceError } from "@pfmp/database";
import { projectUpdateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function serialize(p: {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  billable: boolean;
  status: string;
  createdAtUtc: Date;
  updatedAtUtc: Date;
}) {
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    name: p.name,
    description: p.description,
    billable: p.billable,
    status: p.status,
    createdAtUtc: p.createdAtUtc.toISOString(),
    updatedAtUtc: p.updatedAtUtc.toISOString(),
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
    const row = await new ProjectService(getPrisma()).get(ctx.workspace.id, params.id!);
    return NextResponse.json({ data: serialize(row) });
  } catch (err) {
    mapErr(err);
  }
});

export const PATCH = withAuth(async (request, ctx, params) => {
  const body = await readJson(request, projectUpdateSchema);
  try {
    const row = await new ProjectService(getPrisma()).update(ctx.workspace.id, params.id!, body);
    return NextResponse.json({ data: serialize(row) });
  } catch (err) {
    mapErr(err);
  }
});

export const DELETE = withAuth(async (_request, ctx, params) => {
  try {
    await new ProjectService(getPrisma()).softDelete(ctx.workspace.id, params.id!);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    mapErr(err);
  }
});
