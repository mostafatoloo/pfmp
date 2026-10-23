import { getPrisma, NotificationService, NotificationServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (_req, ctx, params) => {
  try {
    const row = await new NotificationService(getPrisma()).markRead(
      ctx.workspace.id,
      ctx.userId,
      params.id!,
    );
    return NextResponse.json({ data: row });
  } catch (err) {
    if (err instanceof NotificationServiceError) throw new AppError("NOT_FOUND", err.message, 404);
    throw err;
  }
});
