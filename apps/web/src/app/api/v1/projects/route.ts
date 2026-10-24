import { getPrisma, ProjectService, ProjectServiceError } from "@pfmp/database";
import { projectCreateSchema } from "@pfmp/api-contracts";
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

export const GET = withAuth(async (_request, ctx) => {
  const service = new ProjectService(getPrisma());
  const rows = await service.list(ctx.workspace.id);
  return NextResponse.json({ data: rows.map(serialize) });
});

export const POST = withAuth(async (request, ctx) => {
  const body = await readJson(request, projectCreateSchema);
  const service = new ProjectService(getPrisma());
  const row = await service.create(ctx.workspace.id, body);
  return NextResponse.json({ data: serialize(row) }, { status: 201 });
});
