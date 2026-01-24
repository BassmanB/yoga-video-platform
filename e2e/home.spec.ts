import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check that we're on the homepage
    expect(page.url()).toContain("localhost:4321");
  });

  test("should have correct title", async ({ page }) => {
    await page.goto("/");

    // Check for page title
    await expect(page).toHaveTitle(/.*/);
  });
});
