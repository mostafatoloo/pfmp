import { getPrisma, TaskService, TaskServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_request, ctx, params) => {
  const service = new TaskService(getPrisma());
  try {
    const history = await service.history(ctx.workspace.id, params.id!);
    return NextResponse.json({
      data: history.map((h) => ({
        id: h.id,
        taskId: h.taskId,
        eventType: h.eventType,
        fromJson: h.fromJson,
        toJson: h.toJson,
        actorUserId: h.actorUserId,
        createdAtUtc: h.createdAtUtc.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof TaskServiceError) {
      throw new AppError(err.code, err.message, 404);
    }
    throw err;
  }
});
