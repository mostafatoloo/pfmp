import { SignedInShell } from "@/components/signed-in-shell";
import { headers } from "next/headers";
import { requirePageWorkspace } from "@/lib/require-page-auth";
import { createTranslator } from "@pfmp/i18n";
import { MealsClient } from "./meals-client";

export default async function MealsPage() {
  const ctx = await requirePageWorkspace(await headers());
  const { t } = createTranslator(ctx.locale);

  return (
    <SignedInShell pathname="/meals" locale={ctx.locale}>
      <section className="panel">
        <h1>{t("meals.title")}</h1>
        <p className="panel-lead">{t("meals.subtitle")}</p>
        <MealsClient
          workspaceId={ctx.workspace.id}
          labels={{
            planWeek: t("meals.planWeek"),
            addMeal: t("meals.addMeal"),
            mealName: t("meals.mealName"),
            breakfast: t("meals.breakfast"),
            lunch: t("meals.lunch"),
            dinner: t("meals.dinner"),
            snack: t("meals.snack"),
            shoppingList: t("meals.shoppingList"),
            addIngredient: t("meals.addIngredient"),
            generateTasks: t("meals.generateTasks"),
            emptyPlan: t("meals.emptyPlan"),
            emptyShopping: t("meals.emptyShopping"),
            notes: t("meals.notes"),
          }}
        />
      </section>
    </SignedInShell>
  );
}
