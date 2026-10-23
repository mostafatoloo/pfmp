"use client";

import { useEffect, useState } from "react";

type MealEntry = {
  id: string;
  mealDate: string;
  category: string;
  title: string;
  status: string;
};

type ShoppingItem = {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  checkedAtUtc?: string | null;
};

export function MealsClient({
  workspaceId,
  labels,
}: {
  workspaceId: string;
  labels: Record<string, string>;
}) {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("dinner");
  const [mealDate, setMealDate] = useState(new Date().toISOString().slice(0, 10));
  const [itemName, setItemName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/v1/meals?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (!res.ok) {
      setMeals([]);
      setShopping([]);
      return;
    }
    const json = await res.json();
    setMeals(json.data?.meals ?? []);
    setShopping(json.data?.shopping ?? []);
  }

  useEffect(() => {
    void load();
  }, [workspaceId]);

  async function addMeal(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, title, category, mealDate }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed");
        return;
      }
      setTitle("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function addShopping(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/v1/meals/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: itemName }),
      });
      if (res.ok) {
        setItemName("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleItem(id: string, checked: boolean) {
    await fetch(`/api/v1/meals/shopping/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
    await load();
  }

  return (
    <div className="stack">
      {error ? (
        <div className="alert error" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={addMeal} className="card stack">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{labels.planWeek}</h2>
        <div className="row">
          <input
            type="date"
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
            required
            style={{
              minHeight: "var(--touch-min)",
              paddingInline: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line-strong)",
              font: "inherit",
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              minHeight: "var(--touch-min)",
              paddingInline: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line-strong)",
              font: "inherit",
            }}
          >
            <option value="breakfast">{labels.breakfast}</option>
            <option value="lunch">{labels.lunch}</option>
            <option value="dinner">{labels.dinner}</option>
            <option value="snack">{labels.snack}</option>
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={labels.mealName}
            required
            style={{
              flex: "1 1 160px",
              minHeight: "var(--touch-min)",
              paddingInline: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line-strong)",
              font: "inherit",
            }}
          />
          <button className="btn" type="submit" disabled={busy}>
            {labels.addMeal}
          </button>
        </div>
      </form>

      {meals.length === 0 ? (
        <div className="empty-state">{labels.emptyPlan}</div>
      ) : (
        <ul className="list-plain">
          {meals.map((m) => (
            <li key={m.id} className="list-item">
              <span>
                <strong>{m.title}</strong>
                <span className="muted">
                  {" "}
                  · {m.mealDate.slice(0, 10)} · {m.category}
                </span>
              </span>
              <span className="badge">{m.status}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="card stack">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{labels.shoppingList}</h2>
        <form onSubmit={addShopping} className="row">
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={labels.addIngredient}
            required
            style={{
              flex: "1 1 180px",
              minHeight: "var(--touch-min)",
              paddingInline: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line-strong)",
              font: "inherit",
            }}
          />
          <button className="btn secondary" type="submit" disabled={busy}>
            {labels.addIngredient}
          </button>
        </form>
        {shopping.length === 0 ? (
          <p className="muted">{labels.emptyShopping}</p>
        ) : (
          <ul className="list-plain">
            {shopping.map((item) => (
              <li key={item.id} className="list-item">
                <label className="row">
                  <input
                    type="checkbox"
                    checked={Boolean(item.checkedAtUtc)}
                    onChange={(e) => void toggleItem(item.id, e.target.checked)}
                  />
                  <span>
                    {item.name}
                    {item.quantity ? (
                      <span className="muted">
                        {" "}
                        ({item.quantity}
                        {item.unit ? ` ${item.unit}` : ""})
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
