import { getPrisma, TelegramService } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (_request, ctx) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new AppError("VALIDATION_ERROR", "Telegram is not configured on this server", 503);
  }
  const token = await new TelegramService(getPrisma()).createLinkToken(ctx.userId);
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "your_bot";
  return NextResponse.json({
    data: {
      token,
      instructions: `Open Telegram, message @${botUsername}, and send: /start ${token}`,
      expiresInMinutes: 15,
    },
  });
});
