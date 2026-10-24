import { getPrisma, CalendarQueryService } from "@pfmp/database";
import { formatJalaliDisplay } from "@pfmp/calendar";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const from = new Date(url.searchParams.get("from") ?? new Date().toISOString());
  const to = new Date(url.searchParams.get("to") ?? new Date(Date.now() + 7 * 86400000).toISOString());
  const view = url.searchParams.get("view") ?? "week";
  const items = await new CalendarQueryService(getPrisma()).query(ctx.workspace.id, from, to);
  return NextResponse.json({
    data: {
      view,
      fromUtc: from.toISOString(),
      toUtc: to.toISOString(),
      jalaliFrom: formatJalaliDisplay(from),
      jalaliTo: formatJalaliDisplay(to),
      items,
    },
  });
});
