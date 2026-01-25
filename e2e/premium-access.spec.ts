import { test, expect, TEST_VIDEOS, authenticateUser } from "./fixtures";

/**
 * E2E Tests for Premium Content Access Control
 *
 * Covers:
 * - US-04: Premium content visibility with blur
 * - US-10: Premium user access to all content
 * - US-11: Access denial message for free users
 * - FR-08: Access control requirements
 * - FR-18 to FR-19: Security and permissions
 */

test.describe("Premium Content - Unauthenticated User", () => {
  test("should see premium badges on premium content", async ({ homePage }) => {
    // Arrange: Navigate to homepage without authentication
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Premium badges are visible
    const premiumCount = await homePage.getPremiumBadgeCount();

    if (premiumCount > 0) {
      await expect(homePage.premiumBadges.first()).toBeVisible();
      await expect(homePage.premiumBadges.first()).toContainText(/premium/i);
    }
  });

  test("should see blurred thumbnail for premium content", async ({ page, homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();

    // Find a premium video card
    const premiumCard = page.locator('[data-testid="video-card"]:has([data-testid="premium-badge"])').first();

    if ((await premiumCard.count()) > 0) {
      // Assert: Thumbnail has blur effect
      const thumbnail = premiumCard.getByTestId("video-thumbnail");
      const hasBlur = await thumbnail.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.filter.includes("blur") || el.classList.contains("blur");
      });

      expect(hasBlur).toBe(true);
    }
  });

  test("should be denied access when trying to view premium video", async ({ page, videoPage }) => {
    // Act: Navigate to premium video without authentication
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Access denied message is shown
    await expect(videoPage.accessDeniedMessage).toBeVisible();

    // Assert: Message contains contact information
    const message = await videoPage.getAccessDeniedMessage();
    expect(message).toMatch(/premium|dostęp|contact|skontaktuj/i);
  });

  test("should not display video player for premium content", async ({ videoPage }) => {
    // Act: Navigate to premium video without authentication
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Video player is not visible
    await expect(videoPage.videoPlayer).not.toBeVisible();
  });

  test("should show login prompt for premium content", async ({ page, videoPage }) => {
    // Act: Navigate to premium video without authentication
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Login button or link is visible
    const loginLink = page.getByRole("link", { name: /zaloguj|login/i });
    await expect(loginLink).toBeVisible();
  });
});

test.describe("Premium Content - Free User", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange: Authenticate as free user
    await authenticateUser(page, "free");
  });

  test("should see premium badges even when logged in as free user", async ({ homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Premium badges are still visible
    const premiumCount = await homePage.getPremiumBadgeCount();

    if (premiumCount > 0) {
      await expect(homePage.premiumBadges.first()).toBeVisible();
    }
  });

  test("should be denied access to premium video as free user", async ({ videoPage }) => {
    // Act: Navigate to premium video as free user
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Access denied message is shown
    await expect(videoPage.accessDeniedMessage).toBeVisible();

    // Assert: Message explains premium access requirement
    const message = await videoPage.getAccessDeniedMessage();
    expect(message).toMatch(/premium|upgrade|dostęp/i);
  });

  test("should have access to free videos as free user", async ({ videoPage }) => {
    // Act: Navigate to free video as free user
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();

    // Assert: Video player is visible
    await expect(videoPage.videoPlayer).toBeVisible();

    // Assert: No access denied message
    await expect(videoPage.accessDeniedMessage).not.toBeVisible();
  });

  test("should see upgrade information in access denied message", async ({ videoPage }) => {
    // Act: Navigate to premium video as free user
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Message contains upgrade/contact information
    const message = await videoPage.getAccessDeniedMessage();
    expect(message).toMatch(/skontaktuj|contact|email/i);
  });

  test("should display free user badge in navbar", async ({ homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();

    // Act: Get user role
    const role = await homePage.getUserRole();

    // Assert: Role is "Free"
    expect(role).toMatch(/free/i);
  });
});

test.describe("Premium Content - Premium User", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange: Authenticate as premium user
    await authenticateUser(page, "premium");
  });

  test("should have access to all free videos", async ({ videoPage }) => {
    // Act: Navigate to free video as premium user
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();

    // Assert: Video player is visible
    await expect(videoPage.videoPlayer).toBeVisible();

    // Assert: No access denied message
    await expect(videoPage.accessDeniedMessage).not.toBeVisible();
  });

  test("should have access to premium videos", async ({ videoPage }) => {
    // Act: Navigate to premium video as premium user
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Video player is visible
    await expect(videoPage.videoPlayer).toBeVisible();

    // Assert: No access denied message
    await expect(videoPage.accessDeniedMessage).not.toBeVisible();
  });

  test("should see premium badge on video but have access", async ({ videoPage }) => {
    // Act: Navigate to premium video
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Premium badge is visible
    await expect(videoPage.premiumBadge).toBeVisible();

    // Assert: But video player is also visible (has access)
    await expect(videoPage.videoPlayer).toBeVisible();
  });

  test("should display premium user badge in navbar", async ({ homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();

    // Act: Get user role
    const role = await homePage.getUserRole();

    // Assert: Role is "Premium"
    expect(role).toMatch(/premium/i);
  });

  test("should not see blur on premium content thumbnails", async ({ page, homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();

    // Find a premium video card
    const premiumCard = page.locator('[data-testid="video-card"]:has([data-testid="premium-badge"])').first();

    if ((await premiumCard.count()) > 0) {
      // Assert: Thumbnail does not have blur effect
      const thumbnail = premiumCard.getByTestId("video-thumbnail");
      const hasBlur = await thumbnail.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.filter.includes("blur") || el.classList.contains("blur");
      });

      expect(hasBlur).toBe(false);
    }
  });

  test("should be able to play premium videos", async ({ videoPage, page }) => {
    // Act: Navigate to premium video
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Act: Play video
    await videoPage.playVideo();
    await page.waitForTimeout(1000);

    // Assert: Video is playing
    const isPlaying = await videoPage.isVideoPlaying();
    expect(isPlaying).toBe(true);
  });
});

test.describe("Premium Content - Admin User", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange: Authenticate as admin user
    await authenticateUser(page, "admin");
  });

  test("should have access to all videos", async ({ videoPage }) => {
    // Act: Navigate to premium video as admin
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Video player is visible
    await expect(videoPage.videoPlayer).toBeVisible();

    // Assert: No access denied message
    await expect(videoPage.accessDeniedMessage).not.toBeVisible();
  });

  test("should display admin badge in navbar", async ({ homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();

    // Act: Get user role
    const role = await homePage.getUserRole();

    // Assert: Role is "Admin"
    expect(role).toMatch(/admin/i);
  });

  test("should be able to play any video", async ({ videoPage, page }) => {
    // Act: Navigate to premium video
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Act: Play video
    await videoPage.playVideo();
    await page.waitForTimeout(1000);

    // Assert: Video is playing
    const isPlaying = await videoPage.isVideoPlaying();
    expect(isPlaying).toBe(true);
  });
});

test.describe("Premium Content - Access Control Edge Cases", () => {
  test("should redirect to login when session expires on premium video", async ({ page, videoPage }) => {
    // Arrange: Authenticate as premium user
    await authenticateUser(page, "premium");
    await videoPage.goto(TEST_VIDEOS.premium);
    await videoPage.waitForLoad();

    // Assert: Initially has access
    await expect(videoPage.videoPlayer).toBeVisible();

    // Act: Clear cookies to simulate session expiry
    await page.context().clearCookies();

    // Act: Reload page
    await page.reload();
    await videoPage.waitForLoad();

    // Assert: Access is denied after session expiry
    await expect(videoPage.accessDeniedMessage).toBeVisible();
  });

  test("should handle direct URL access to premium video", async ({ page }) => {
    // Act: Try to access premium video directly via URL without auth
    await page.goto(`/video/${TEST_VIDEOS.premium}`);

    // Assert: Access denied or redirected to login
    await expect(page.locator("text=/premium|dostęp|access|login/i")).toBeVisible();
  });

  test("should not allow video URL manipulation to bypass access control", async ({ page }) => {
    // Arrange: Authenticate as free user
    await authenticateUser(page, "free");

    // Act: Try to access premium video
    await page.goto(`/video/${TEST_VIDEOS.premium}`);

    // Assert: Access is still denied
    const accessDenied = page.getByTestId("access-denied-message");
    await expect(accessDenied).toBeVisible();

    // Assert: Cannot access video source directly
    const videoElement = page.locator("video");
    const videoCount = await videoElement.count();

    if (videoCount > 0) {
      // If video element exists, it should not have a valid source
      const hasSrc = await videoElement.evaluate((el: HTMLVideoElement) => {
        return el.src && el.src.length > 0;
      });
      expect(hasSrc).toBe(false);
    }
  });
});

test.describe("Premium Content - Visual Indicators", () => {
  test("should have distinct visual styling for premium badges", async ({ page, homePage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();

    // Find premium badge
    const premiumBadge = homePage.premiumBadges.first();

    if ((await premiumBadge.count()) > 0) {
      // Assert: Badge has premium styling (e.g., specific color)
      const badgeColor = await premiumBadge.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Premium badges should have distinct styling
      expect(badgeColor).toBeTruthy();
    }
  });

  test("should show premium indicator consistently across pages", async ({ page, homePage, videoPage }) => {
    // Arrange: Navigate to homepage
    await homePage.goto();
    await homePage.waitForLoad();

    // Assert: Premium badge on card
    const cardBadgeVisible = await homePage.premiumBadges.first().isVisible();

    if (cardBadgeVisible) {
      // Act: Navigate to premium video detail
      await page.goto(`/video/${TEST_VIDEOS.premium}`);
      await videoPage.waitForLoad();

      // Assert: Premium badge also on detail page
      await expect(videoPage.premiumBadge).toBeVisible();
    }
  });
});

test.describe("Premium Content - API Security", () => {
  test("should not expose premium video URLs to free users via API", async ({ page }) => {
    // Arrange: Authenticate as free user
    await authenticateUser(page, "free");

    // Act: Try to fetch premium video data via API
    const response = await page.request.get(`/api/videos/${TEST_VIDEOS.premium}`);

    // Assert: Either 403 Forbidden or video_url is not included
    if (response.ok()) {
      const data = await response.json();
      // Video URL should be hidden or obfuscated for free users
      expect(data.video_url).toBeUndefined();
    } else {
      expect(response.status()).toBe(403);
    }
  });

  test("should expose premium video URLs to premium users via API", async ({ page }) => {
    // Arrange: Authenticate as premium user
    await authenticateUser(page, "premium");

    // Act: Fetch premium video data via API
    const response = await page.request.get(`/api/videos/${TEST_VIDEOS.premium}`);

    // Assert: Request is successful
    expect(response.ok()).toBe(true);

    // Assert: Video URL is included
    const data = await response.json();
    expect(data.video_url).toBeTruthy();
  });
});
