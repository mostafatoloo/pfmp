import { getPrisma, ProgressQueryService } from "@pfmp/database";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const from = new Date(url.searchParams.get("from") ?? "2026-01-01T00:00:00.000Z");
  const to = new Date(url.searchParams.get("to") ?? new Date().toISOString());
  const summary = await new ProgressQueryService(getPrisma()).summary(ctx.workspace.id, from, to);
  return NextResponse.json({ data: summary });
});
