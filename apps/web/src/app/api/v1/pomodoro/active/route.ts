import { getPrisma, PomodoroService } from "@pfmp/database";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, ctx) => {
  const active = await new PomodoroService(getPrisma()).getActive(ctx.workspace.id);
  return NextResponse.json({
    data: active
      ? {
          id: active.id,
          kind: active.kind,
          taskId: active.taskId,
          startedAtUtc: active.startedAtUtc.toISOString(),
        }
      : null,
  });
});
