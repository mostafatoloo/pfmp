import { getPrisma, MealService, MealServiceError } from "@pfmp/database";
import { requireWorkspaceAccess } from "@pfmp/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (request, ctx) => {
  const body = await readJson(
    request,
    z.object({
      workspaceId: z.string().uuid().optional(),
      name: z.string().min(1).max(300),
      quantity: z.string().optional(),
      unit: z.string().optional(),
    }),
  );
  const workspaceId = body.workspaceId ?? ctx.workspace.id;
  await requireWorkspaceAccess(request.headers, workspaceId);
  const service = new MealService(getPrisma());
  try {
    const item = await service.addShoppingItem(workspaceId, body);
    return NextResponse.json({ data: { id: item.id, name: item.name } }, { status: 201 });
  } catch (err) {
    if (err instanceof MealServiceError) {
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    }
    throw err;
  }
});
