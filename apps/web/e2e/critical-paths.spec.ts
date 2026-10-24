import { expect, test } from "@playwright/test";

/**
 * Stage 5 critical journeys (test-strategy.md).
 * Magic-link full cookie flow needs live Better Auth + SQL Server — covered when
 * E2E_FULL=1 and DATABASE_URL / BETTER_AUTH_* are set; otherwise smoke public UI.
 */

test.describe("public shell", () => {
  test("sign-in page loads (desktop)", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "PFMP" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: /magic link/i })).toBeVisible();
  });

  test("unauthenticated /today redirects to sign-in", async ({ page }) => {
    await page.goto("/today");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("API /api/v1/me returns 401 without session", async ({ request }) => {
    const res = await request.get("/api/v1/me");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("AI proposals unavailable when AI_ENABLED unset", async ({ request }) => {
    const res = await request.post("/api/v1/plan-proposals", {
      data: { promptSummary: "e2e" },
    });
    // 401 without session is also acceptable; if somehow authenticated in CI, expect 503
    expect([401, 503]).toContain(res.status());
    if (res.status() === 503) {
      const body = await res.json();
      expect(body.error.code).toBe("AI_UNAVAILABLE");
    }
  });
});

test.describe("authenticated journeys", () => {
  test.skip(!process.env.E2E_FULL, "Set E2E_FULL=1 with live SQL Server + auth for full journeys");

  test("magic link → task capture → timer recover", async ({ page, request }) => {
    // Request magic link
    const email = `e2e-${Date.now()}@example.com`;
    const ml = await request.post("/api/auth/sign-in/magic-link", {
      data: { email, name: "E2E User", callbackURL: "/today" },
    });
    expect(ml.ok()).toBeTruthy();

    // Dev log capture is server-side; for E2E_FULL operators pass E2E_MAGIC_LINK_URL
    const url = process.env.E2E_MAGIC_LINK_URL;
    test.skip(!url, "Provide E2E_MAGIC_LINK_URL from server magic-link log");

    await page.goto(url!);
    await expect(page).toHaveURL(/today|tasks/);

    await page.goto("/tasks");
    await page.getByLabel("New task title").fill("E2E capture");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("E2E capture")).toBeVisible();

    // Timer via API with cookies from page context
    const start = await page.request.post("/api/v1/timer/start", {
      data: { note: "e2e" },
    });
    expect(start.status()).toBe(201);
    await page.reload();
    const active = await page.request.get("/api/v1/timer");
    const activeBody = await active.json();
    expect(activeBody.data).toBeTruthy();
    const stop = await page.request.post("/api/v1/timer/stop");
    expect(stop.ok()).toBeTruthy();
  });
});
