import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export class MealServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "VALIDATION",
    message: string,
  ) {
    super(message);
    this.name = "MealServiceError";
  }
}

const CATEGORIES = new Set(["breakfast", "lunch", "dinner", "snack"]);

export class MealService {
  constructor(private readonly prisma: PrismaClient) {}

  async ensureWeekPlan(workspaceId: string, userId: string, weekStartDate: Date, title?: string) {
    const existing = await this.prisma.mealPlan.findFirst({
      where: {
        workspaceId,
        weekStartDate,
        deletedAtUtc: null,
      },
    });
    if (existing) return existing;
    return this.prisma.mealPlan.create({
      data: {
        workspaceId,
        weekStartDate,
        title: title ?? "Week plan",
        createdByUserId: userId,
      },
    });
  }

  listPlans(workspaceId: string) {
    return this.prisma.mealPlan.findMany({
      where: { workspaceId, deletedAtUtc: null },
      orderBy: { weekStartDate: "desc" },
      include: { entries: { orderBy: { mealDate: "asc" } } },
    });
  }

  async listMeals(workspaceId: string, from?: Date, to?: Date) {
    return this.prisma.mealEntry.findMany({
      where: {
        workspaceId,
        ...(from || to
          ? {
              mealDate: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ mealDate: "asc" }, { category: "asc" }],
    });
  }

  async addMeal(
    workspaceId: string,
    userId: string,
    input: {
      mealDate: Date;
      category: string;
      title: string;
      notes?: string;
      weekStartDate?: Date;
    },
  ) {
    if (!CATEGORIES.has(input.category)) {
      throw new MealServiceError("VALIDATION", "Invalid meal category");
    }
    const title = input.title.trim();
    if (!title) throw new MealServiceError("VALIDATION", "Title required");

    const weekStart =
      input.weekStartDate ??
      (() => {
        const d = new Date(input.mealDate);
        const day = d.getUTCDay();
        const diff = (day + 6) % 7; // Monday-start
        d.setUTCDate(d.getUTCDate() - diff);
        return d;
      })();

    const plan = await this.ensureWeekPlan(workspaceId, userId, weekStart);
    return this.prisma.mealEntry.create({
      data: {
        mealPlanId: plan.id,
        workspaceId,
        mealDate: input.mealDate,
        category: input.category,
        title,
        notes: input.notes,
        status: "planned",
      },
    });
  }

  async updateMeal(
    workspaceId: string,
    id: string,
    patch: Partial<{ title: string; notes: string; status: string; preparedByUserId: string | null }>,
  ) {
    const existing = await this.prisma.mealEntry.findFirst({ where: { id, workspaceId } });
    if (!existing) throw new MealServiceError("NOT_FOUND", "Meal not found");
    return this.prisma.mealEntry.update({
      where: { id },
      data: {
        title: patch.title?.trim() ?? undefined,
        notes: patch.notes,
        status: patch.status,
        preparedByUserId: patch.preparedByUserId,
      },
    });
  }

  async ensureShoppingList(workspaceId: string, mealPlanId?: string | null, title = "Shopping") {
    const existing = await this.prisma.shoppingList.findFirst({
      where: {
        workspaceId,
        ...(mealPlanId ? { mealPlanId } : { mealPlanId: null }),
      },
    });
    if (existing) return existing;
    return this.prisma.shoppingList.create({
      data: { workspaceId, mealPlanId: mealPlanId ?? null, title },
    });
  }

  async listShopping(workspaceId: string) {
    const list = await this.ensureShoppingList(workspaceId);
    const items = await this.prisma.shoppingItem.findMany({
      where: { shoppingListId: list.id, workspaceId },
      orderBy: { createdAtUtc: "asc" },
    });
    return { list, items };
  }

  async addShoppingItem(
    workspaceId: string,
    input: { name: string; quantity?: string; unit?: string; mealEntryId?: string },
  ) {
    const name = input.name.trim();
    if (!name) throw new MealServiceError("VALIDATION", "Name required");
    const list = await this.ensureShoppingList(workspaceId);
    return this.prisma.shoppingItem.create({
      data: {
        shoppingListId: list.id,
        workspaceId,
        name,
        quantity: input.quantity,
        unit: input.unit,
        mealEntryId: input.mealEntryId,
      },
    });
  }

  async setShoppingChecked(workspaceId: string, itemId: string, checked: boolean) {
    const item = await this.prisma.shoppingItem.findFirst({ where: { id: itemId, workspaceId } });
    if (!item) throw new MealServiceError("NOT_FOUND", "Item not found");
    return this.prisma.shoppingItem.update({
      where: { id: itemId },
      data: { checkedAtUtc: checked ? utcNow() : null },
    });
  }

  /** Optional: create prep/shopping tasks when user requests. */
  async generateRelatedTasks(workspaceId: string, actorUserId: string, mealEntryId: string) {
    const meal = await this.prisma.mealEntry.findFirst({ where: { id: mealEntryId, workspaceId } });
    if (!meal) throw new MealServiceError("NOT_FOUND", "Meal not found");
    const due = new Date(meal.mealDate);
    due.setUTCHours(17, 0, 0, 0);
    return this.prisma.task.create({
      data: {
        workspaceId,
        title: `Prep: ${meal.title}`,
        notes: meal.notes,
        status: "planned",
        dueAtUtc: due,
        createdByUserId: actorUserId,
      },
    });
  }
}
