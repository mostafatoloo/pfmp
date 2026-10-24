import { getPrisma, MealService, MealServiceError } from "@pfmp/database";
import { requireWorkspaceAccess } from "@pfmp/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (request, ctx) => {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId") ?? ctx.workspace.id;
  await requireWorkspaceAccess(request.headers, workspaceId);
  const meals = new MealService(getPrisma());
  const [mealRows, shopping] = await Promise.all([
    meals.listMeals(workspaceId),
    meals.listShopping(workspaceId),
  ]);
  return NextResponse.json({
    data: {
      meals: mealRows.map((m) => ({
        id: m.id,
        mealDate: m.mealDate.toISOString(),
        category: m.category,
        title: m.title,
        status: m.status,
      })),
      shopping: shopping.items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        checkedAtUtc: i.checkedAtUtc?.toISOString() ?? null,
      })),
    },
  });
});

export const POST = withAuth(async (request, ctx) => {
  const body = await readJson(
    request,
    z.object({
      workspaceId: z.string().uuid().optional(),
      title: z.string().min(1).max(300),
      category: z.enum(["breakfast", "lunch", "dinner", "snack"]),
      mealDate: z.string().min(8),
      notes: z.string().optional(),
    }),
  );
  const workspaceId = body.workspaceId ?? ctx.workspace.id;
  await requireWorkspaceAccess(request.headers, workspaceId);
  const service = new MealService(getPrisma());
  try {
    const meal = await service.addMeal(workspaceId, ctx.userId, {
      title: body.title,
      category: body.category,
      mealDate: new Date(body.mealDate),
      notes: body.notes,
    });
    return NextResponse.json(
      {
        data: {
          id: meal.id,
          title: meal.title,
          category: meal.category,
          mealDate: meal.mealDate.toISOString(),
          status: meal.status,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof MealServiceError) {
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    }
    throw err;
  }
});
