import { getPrisma, TelegramService } from "@pfmp/database";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_request, ctx) => {
  const link = await new TelegramService(getPrisma()).getActiveLink(ctx.userId);
  return NextResponse.json({
    data: {
      linked: Boolean(link),
      linkedAtUtc: link?.linkedAtUtc.toISOString() ?? null,
    },
  });
});
