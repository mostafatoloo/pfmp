import { getPrisma, TelegramService, TelegramServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (_request, ctx) => {
  try {
    await new TelegramService(getPrisma()).unlink(ctx.userId);
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof TelegramServiceError) {
      throw new AppError("NOT_FOUND", err.message, 404);
    }
    throw err;
  }
});
