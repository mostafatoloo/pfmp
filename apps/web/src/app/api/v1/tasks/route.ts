import { getPrisma, TaskService, TaskServiceError } from "@pfmp/database";
import { taskCreateSchema, taskListQuerySchema } from "@pfmp/api-contracts";
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
    createdAtUtc: t.createdAtUtc.toISOString(),
    updatedAtUtc: t.updatedAtUtc.toISOString(),
  };
}

export const GET = withAuth(async (request, ctx) => {
  const url = new URL(request.url);
  const query = taskListQuerySchema.parse({
    status: url.searchParams.get("status") ?? undefined,
    dueBefore: url.searchParams.get("dueBefore") ?? undefined,
    dueAfter: url.searchParams.get("dueAfter") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    preset: url.searchParams.get("preset") ?? undefined,
  });
  const service = new TaskService(getPrisma());
  const tasks = await service.list(ctx.workspace.id, {
    status: query.status,
    dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
    dueAfter: query.dueAfter ? new Date(query.dueAfter) : undefined,
    q: query.q,
    preset: query.preset,
  });
  return NextResponse.json({ data: tasks.map(serializeTask) });
});

export const POST = withAuth(async (request, ctx) => {
  const body = await readJson(request, taskCreateSchema);
  const service = new TaskService(getPrisma());
  try {
    const task = await service.create(ctx.workspace.id, ctx.userId, {
      title: body.title,
      notes: body.notes,
      status: body.status,
      dueAtUtc: body.dueAtUtc === undefined ? undefined : body.dueAtUtc ? new Date(body.dueAtUtc) : null,
      projectId: body.projectId,
      courseId: body.courseId,
      priority: body.priority,
    });
    return NextResponse.json({ data: serializeTask(task) }, { status: 201 });
  } catch (err) {
    if (err instanceof TaskServiceError) {
      throw new AppError(err.code, err.message, err.code === "NOT_FOUND" ? 404 : 400);
    }
    throw err;
  }
});
