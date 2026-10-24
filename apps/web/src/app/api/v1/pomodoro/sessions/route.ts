import { getPrisma, PomodoroService } from "@pfmp/database";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, ctx) => {
  const rows = await new PomodoroService(getPrisma()).listSessions(ctx.workspace.id);
  return NextResponse.json({ data: rows });
});
