import { getPrisma, NotificationService } from "@pfmp/database";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, ctx) => {
  const rows = await new NotificationService(getPrisma()).list(ctx.workspace.id, ctx.userId);
  return NextResponse.json({ data: rows });
});
