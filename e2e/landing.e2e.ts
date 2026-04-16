import { test, expect } from "@playwright/test";

test("landing page renders hero and health endpoint is alive", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /what'?s that font/i })).toBeVisible();

  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  const body = (await health.json()) as { ok: boolean; version: string };
  expect(body.ok).toBe(true);
});
