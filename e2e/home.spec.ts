import { test, expect } from "./fixtures";

/**
 * Basic Home Page Tests
 *
 * Simple smoke tests to verify homepage loads correctly
 */

test.describe("Home Page - Basic", () => {
  test("should load successfully", async ({ homePage, page }) => {
    // Arrange & Act
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Page loaded successfully
    expect(page.url()).toContain("localhost:4321");
  });

  test("should have correct title", async ({ homePage, page }) => {
    // Arrange & Act
    await homePage.goto();

    // Assert: Page has a title
    await expect(page).toHaveTitle(/.+/);
  });

  test("should display navbar", async ({ homePage }) => {
    // Arrange & Act
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Navbar is visible
    await expect(homePage.navbar).toBeVisible();
  });

  test("should display video grid", async ({ homePage }) => {
    // Arrange & Act
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Video grid is visible
    await expect(homePage.videoGrid).toBeVisible();
  });

  test("should display filter bar", async ({ homePage }) => {
    // Arrange & Act
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Filter bar is visible
    await expect(homePage.filterBar).toBeVisible();
  });
});
