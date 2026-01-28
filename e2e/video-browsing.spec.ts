import { test, expect } from "./fixtures";

/**
 * E2E Tests for Video Browsing and Filtering
 *
 * Covers:
 * - US-01: Viewing free videos on homepage
 * - US-02: Filtering by category
 * - US-03: Video card information display
 * - US-04: Premium content visibility
 * - FR-01 to FR-04: Homepage requirements
 */

test.describe("Video Browsing", () => {
  test.beforeEach(async ({ homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test("should display video grid on homepage", async ({ homePage }) => {
    // Assert: Video grid is visible
    await expect(homePage.videoGrid).toBeVisible();

    // Assert: At least one video card is displayed
    const videoCount = await homePage.getVideoCardCount();
    expect(videoCount).toBeGreaterThan(0);
  });

  test("should display video card information", async ({ homePage }) => {
    // Assert: First video card has required information
    const firstCard = homePage.videoCards.first();

    await expect(firstCard.getByTestId("video-title")).toBeVisible();
    await expect(firstCard.getByTestId("video-thumbnail")).toBeVisible();
    await expect(firstCard.getByTestId("video-duration")).toBeVisible();
    await expect(firstCard.getByTestId("video-category")).toBeVisible();
    await expect(firstCard.getByTestId("video-level")).toBeVisible();
  });

  test("should show premium badges on premium content", async ({ homePage }) => {
    // Assert: Premium badges are visible
    const premiumCount = await homePage.getPremiumBadgeCount();

    if (premiumCount > 0) {
      await expect(homePage.premiumBadges.first()).toBeVisible();
      await expect(homePage.premiumBadges.first()).toContainText(/premium/i);
    }
  });

  test("should navigate to video detail page when clicking card", async ({ homePage, page }) => {
    // Act: Click first video card
    await homePage.clickVideoCard(0);

    // Assert: URL changed to video detail page
    await expect(page).toHaveURL(/\/video\/.+/);
  });
});

test.describe("Category Filtering", () => {
  test.beforeEach(async ({ homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test("should filter videos by Yoga category", async ({ homePage, page }) => {
    // Act: Click Yoga category filter
    await homePage.filterByCategory("Yoga");

    // Assert: URL contains category parameter
    await expect(page).toHaveURL(/category=yoga/);

    // Assert: Yoga button is active
    const isActive = await homePage.hasActiveFilter("Yoga");
    expect(isActive).toBe(true);
  });

  test("should filter videos by Mobilność category", async ({ homePage, page }) => {
    // Act: Click Mobilność category filter
    await homePage.filterByCategory("Mobilność");

    // Assert: URL contains category parameter
    await expect(page).toHaveURL(/category=mobility/);

    // Assert: Mobilność button is active
    const isActive = await homePage.hasActiveFilter("Mobilność");
    expect(isActive).toBe(true);
  });

  test("should filter videos by Kalistenika category", async ({ homePage, page }) => {
    // Act: Click Kalistenika category filter
    await homePage.filterByCategory("Kalistenika");

    // Assert: URL contains category parameter
    await expect(page).toHaveURL(/category=calisthenics/);

    // Assert: Kalistenika button is active
    const isActive = await homePage.hasActiveFilter("Kalistenika");
    expect(isActive).toBe(true);
  });

  test("should switch between categories", async ({ homePage, page }) => {
    // Act: Filter by Yoga
    await homePage.filterByCategory("Yoga");
    await expect(page).toHaveURL(/category=yoga/);

    // Act: Switch to Mobilność
    await homePage.filterByCategory("Mobilność");
    await expect(page).toHaveURL(/category=mobility/);

    // Assert: URL no longer contains yoga
    expect(page.url()).not.toContain("category=yoga");
  });

  test("should return to all videos when clicking Wszystkie", async ({ homePage, page }) => {
    // Arrange: Filter by category first
    await homePage.filterByCategory("Yoga");
    await expect(page).toHaveURL(/category=yoga/);

    // Act: Click "Wszystkie"
    await homePage.filterByCategory("Wszystkie");

    // Assert: URL no longer contains category parameter
    expect(page.url()).not.toContain("category=");
  });
});

test.describe("Level Filtering", () => {
  test.beforeEach(async ({ homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test("should filter videos by beginner level", async ({ homePage, page }) => {
    // Act: Select beginner level
    await homePage.filterByLevel("Początkujący");

    // Assert: URL contains level parameter
    await expect(page).toHaveURL(/level=beginner/);
  });

  test("should filter videos by intermediate level", async ({ homePage, page }) => {
    // Act: Select intermediate level
    await homePage.filterByLevel("Średniozaawansowany");

    // Assert: URL contains level parameter
    await expect(page).toHaveURL(/level=intermediate/);
  });

  test("should filter videos by advanced level", async ({ homePage, page }) => {
    // Act: Select advanced level
    await homePage.filterByLevel("Zaawansowany");

    // Assert: URL contains level parameter
    await expect(page).toHaveURL(/level=advanced/);
  });
});

test.describe("Combined Filters", () => {
  test.beforeEach(async ({ homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test("should apply both category and level filters", async ({ homePage, page }) => {
    // Act: Apply category filter
    await homePage.filterByCategory("Yoga");

    // Act: Apply level filter
    await homePage.filterByLevel("Początkujący");

    // Assert: URL contains both parameters
    await expect(page).toHaveURL(/category=yoga/);
    await expect(page).toHaveURL(/level=beginner/);
  });

  test("should show clear filters button when filters are active", async ({ homePage }) => {
    // Act: Apply filters
    await homePage.filterByCategory("Yoga");
    await homePage.filterByLevel("Początkujący");

    // Assert: Clear filters button is visible
    await expect(homePage.clearFiltersButton).toBeVisible();
  });

  test("should clear all filters when clicking clear button", async ({ homePage, page }) => {
    // Arrange: Apply multiple filters
    await homePage.filterByCategory("Yoga");
    await homePage.filterByLevel("Początkujący");

    // Act: Clear filters
    await homePage.clearFilters();

    // Assert: URL no longer contains filter parameters
    expect(page.url()).not.toContain("category=");
    expect(page.url()).not.toContain("level=");

    // Assert: Clear button is hidden
    await expect(homePage.clearFiltersButton).not.toBeVisible();
  });

  test("should initialize filters from URL parameters", async ({ page, homePage }) => {
    // Arrange: Navigate with URL parameters
    await page.goto("/?category=mobility&level=intermediate");
    await homePage.waitForLoad();

    // Assert: Category filter is active
    const isCategoryActive = await homePage.hasActiveFilter("Mobilność");
    expect(isCategoryActive).toBe(true);

    // Assert: Clear filters button is visible
    await expect(homePage.clearFiltersButton).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("should work on mobile viewport", async ({ page, homePage }) => {
    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Filter bar is visible
    await expect(homePage.filterBar).toBeVisible();

    // Assert: Video grid is visible
    await expect(homePage.videoGrid).toBeVisible();

    // Act: Apply filter
    await homePage.filterByCategory("Yoga");

    // Assert: Filter works on mobile
    await expect(page).toHaveURL(/category=yoga/);
  });

  test("should have scrollable categories on mobile", async ({ page, homePage }) => {
    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Category buttons container is scrollable
    const categoryGroup = page.locator('[role="group"][aria-label*="kategorii"]');
    await expect(categoryGroup).toBeVisible();

    // Assert: Can scroll horizontally
    const isScrollable = await categoryGroup.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(isScrollable).toBe(true);
  });
});
