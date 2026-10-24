import { getPrisma, MealService, MealServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const PATCH = withAuth(async (request, ctx, params) => {
  const id = params.id;
  if (!id) throw new AppError("VALIDATION_ERROR", "Missing id", 400);
  const body = await readJson(request, z.object({ checked: z.boolean() }));
  const service = new MealService(getPrisma());
  try {
    const item = await service.setShoppingChecked(ctx.workspace.id, id, body.checked);
    return NextResponse.json({
      data: { id: item.id, checkedAtUtc: item.checkedAtUtc?.toISOString() ?? null },
    });
  } catch (err) {
    if (err instanceof MealServiceError) {
      throw new AppError(err.code === "NOT_FOUND" ? "NOT_FOUND" : "VALIDATION_ERROR", err.message, err.code === "NOT_FOUND" ? 404 : 400);
    }
    throw err;
  }
});
