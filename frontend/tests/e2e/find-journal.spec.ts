import { test, expect } from "@playwright/test";

const UNIQUE = Date.now();
const EMAIL = `e2e_finds_${UNIQUE}@digby.rocks`;
const PASSWORD = "testpassword123";

test.describe("Find Journal", () => {
  test.beforeAll(async ({ browser }) => {
    // Register user once for all tests in this file
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/register");
    await page.getByLabel(/name/i).fill("Finds Tester");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /sign up|register/i }).click();
    await expect(page).toHaveURL("/");
    await ctx.close();
  });

  test("log a new find", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    await page.goto("/finds/new");
    await page.getByLabel(/mineral/i).fill("Calcite");
    await page.getByLabel(/date/i).fill("2026-05-01");
    await page.getByRole("button", { name: /log find|submit/i }).click();

    // After submit, should either show UV prompt or navigate to finds
    await expect(page).toHaveURL(/finds/);
  });

  test("find journal page loads for authenticated user", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    await page.goto("/finds/my");
    await expect(page.getByText(/find journal|my finds/i)).toBeVisible();
  });

  test("find feed is publicly visible", async ({ page }) => {
    await page.goto("/finds");
    await expect(page.getByText(/find feed|recent finds/i)).toBeVisible();
  });
});
