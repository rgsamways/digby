import { test, expect } from "@playwright/test";

const UNIQUE = Date.now();
const TEST_EMAIL = `e2e_${UNIQUE}@digby.rocks`;
const TEST_PASSWORD = "testpassword123";
const TEST_NAME = "E2E Tester";

test.describe("Authentication", () => {
  test("register → land on home page with nav showing name", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/name/i).fill(TEST_NAME);
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign up|register/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText(TEST_NAME)).toBeVisible();
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText(TEST_NAME)).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong|failed/i)).toBeVisible();
  });

  test("logout clears session", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL("/");

    // Open user menu and log out
    await page.getByText(TEST_NAME).click();
    await page.getByRole("button", { name: /log out/i }).click();

    // Should see login/sign up links again
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
  });
});
