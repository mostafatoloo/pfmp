import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, type PrismaClient } from "../../src/client";
import { WorkspaceRepository } from "../../src/workspace-repository";
import { MealService, MealServiceError } from "../../src/meal-service";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("Phase 2 meal planning (SQL Server)", () => {
  let prisma: PrismaClient;
  let meals: MealService;
  let userId: string;
  let workspaceId: string;

  beforeAll(async () => {
    prisma = createPrismaClient(databaseUrl!);
    meals = new MealService(prisma);
    const workspaces = new WorkspaceRepository(prisma);
    await prisma.$connect();

    userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        name: "Meal Planner",
        email: `meal-${userId.slice(0, 8)}@test.com`,
        emailVerified: true,
      },
    });
    workspaceId = (await workspaces.createPersonalWorkspace(userId)).id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a meal plan with entries", async () => {
    const plan = await meals.createMealPlan(workspaceId, {
      weekStartDate: new Date("2026-10-19"),
      title: "Week 43",
      createdByUserId: userId,
    });
    expect(plan.title).toBe("Week 43");

    const entry = await meals.createMealEntry(workspaceId, {
      mealPlanId: plan.id,
      mealDate: new Date("2026-10-19"),
      category: "breakfast",
      title: "Pancakes",
    });
    expect(entry.category).toBe("breakfast");

    const fetched = await meals.getMealPlan(workspaceId, plan.id);
    expect(fetched.entries).toHaveLength(1);
  });

  it("rejects invalid meal category", async () => {
    const plan = await meals.createMealPlan(workspaceId, {
      weekStartDate: new Date("2026-10-26"),
      createdByUserId: userId,
    });
    await expect(
      meals.createMealEntry(workspaceId, {
        mealPlanId: plan.id,
        mealDate: new Date("2026-10-26"),
        category: "brunch",
        title: "Eggs",
      }),
    ).rejects.toBeInstanceOf(MealServiceError);
  });

  it("creates shopping list with items and toggles check", async () => {
    const list = await meals.createShoppingList(workspaceId, { title: "Groceries" });
    const item = await meals.addShoppingItem(workspaceId, {
      shoppingListId: list.id,
      name: "Milk",
      quantity: "1",
      unit: "liter",
    });
    expect(item.checkedAtUtc).toBeNull();

    const checked = await meals.checkShoppingItem(workspaceId, item.id);
    expect(checked.checkedAtUtc).not.toBeNull();

    const unchecked = await meals.checkShoppingItem(workspaceId, item.id);
    expect(unchecked.checkedAtUtc).toBeNull();
  });
});
