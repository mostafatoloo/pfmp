import { getPrisma, TaskService, TaskServiceError } from "@pfmp/database";
import { taskUpdateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function serializeTask(t: {
  id: string;
  workspaceId: string;
  title: string;
  notes: string | null;
  status: string;
  dueAtUtc: Date | null;
  originalDueAtUtc: Date | null;
  completedAtUtc: Date | null;
  projectId: string | null;
  courseId: string | null;
  priority: number | null;
  pomodoroEstimate: number | null;
  createdAtUtc: Date;
  updatedAtUtc: Date;
}) {
  return {
    id: t.id,
    workspaceId: t.workspaceId,
    title: t.title,
    notes: t.notes,
    status: t.status,
    dueAtUtc: t.dueAtUtc?.toISOString() ?? null,
    originalDueAtUtc: t.originalDueAtUtc?.toISOString() ?? null,
    completedAtUtc: t.completedAtUtc?.toISOString() ?? null,
    projectId: t.projectId,
    courseId: t.courseId,
    priority: t.priority,
    pomodoroEstimate: t.pomodoroEstimate,
    createdAtUtc: t.createdAtUtc.toISOString(),
    updatedAtUtc: t.updatedAtUtc.toISOString(),
  };
}

function mapServiceError(err: unknown): never {
  if (err instanceof TaskServiceError) {
    const status =
      err.code === "NOT_FOUND" ? 404 : err.code === "INVALID_STATUS_TRANSITION" ? 400 : 400;
    throw new AppError(err.code, err.message, status);
  }
  throw err;
}

export const GET = withAuth(async (_request, ctx, params) => {
  const service = new TaskService(getPrisma());
  try {
    const task = await service.get(ctx.workspace.id, params.id!);
    return NextResponse.json({ data: serializeTask(task) });
  } catch (err) {
    mapServiceError(err);
  }
});

export const PATCH = withAuth(async (request, ctx, params) => {
  const body = await readJson(request, taskUpdateSchema);
  const service = new TaskService(getPrisma());
  try {
    const task = await service.update(ctx.workspace.id, params.id!, ctx.userId, {
      title: body.title,
      notes: body.notes,
      status: body.status,
      dueAtUtc: body.dueAtUtc === undefined ? undefined : body.dueAtUtc ? new Date(body.dueAtUtc) : null,
      projectId: body.projectId,
      courseId: body.courseId,
      priority: body.priority,
      pomodoroEstimate: body.pomodoroEstimate,
    });
    return NextResponse.json({ data: serializeTask(task) });
  } catch (err) {
    mapServiceError(err);
  }
});

export const DELETE = withAuth(async (_request, ctx, params) => {
  const service = new TaskService(getPrisma());
  try {
    await service.softDelete(ctx.workspace.id, params.id!, ctx.userId);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    mapServiceError(err);
  }
});
