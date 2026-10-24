import { getPrisma, TimeService } from "@pfmp/database";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, ctx) => {
  const active = await new TimeService(getPrisma()).getActiveTimer(ctx.workspace.id);
  return NextResponse.json({
    data: active
      ? { ...active, startedAtUtc: active.startedAtUtc.toISOString() }
      : null,
  });
});
