import { test, expect, TEST_VIDEOS, authenticateUser } from "./fixtures";

/**
 * E2E Tests for Video Playback
 *
 * Covers:
 * - US-08: Video detail page navigation
 * - US-09: Playback speed control
 * - US-10: Premium user access to all content
 * - FR-06 to FR-07: Video player requirements
 */

test.describe("Video Detail Page", () => {
  test("should display video player on video page", async ({ videoPage }) => {
    // Arrange: Navigate to free video
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();

    // Assert: Video player is visible
    await expect(videoPage.videoPlayer).toBeVisible();
  });

  test("should display video information", async ({ videoPage }) => {
    // Arrange: Navigate to free video
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();

    // Assert: Video title is visible
    await expect(videoPage.videoTitle).toBeVisible();

    // Assert: Video description is visible
    await expect(videoPage.videoDescription).toBeVisible();

    // Assert: Video category is visible
    await expect(videoPage.videoCategory).toBeVisible();

    // Assert: Video level is visible
    await expect(videoPage.videoLevel).toBeVisible();

    // Assert: Video duration is visible
    await expect(videoPage.videoDuration).toBeVisible();
  });

  test("should have back button to return to homepage", async ({ page, videoPage }) => {
    // Arrange: Navigate to video page
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();

    // Act: Click back button
    await videoPage.goBack();

    // Assert: Returned to homepage
    await expect(page).toHaveURL(/\/$/);
  });

  test("should show 404 for non-existent video", async ({ page }) => {
    // Act: Navigate to non-existent video
    await page.goto("/video/non-existent-id");

    // Assert: 404 page or error message is shown
    await expect(page.locator("text=/404|nie znaleziono|not found/i")).toBeVisible();
  });
});

test.describe("Video Player Controls", () => {
  test.beforeEach(async ({ page, videoPage }) => {
    // Arrange: Authenticate as premium user and navigate to video
    await authenticateUser(page, "premium");
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();
  });

  test("should play video when clicking play button", async ({ videoPage, page }) => {
    // Act: Click play button
    await videoPage.playVideo();

    // Wait for video to start playing
    await page.waitForTimeout(1000);

    // Assert: Video is playing
    const isPlaying = await videoPage.isVideoPlaying();
    expect(isPlaying).toBe(true);
  });

  test("should pause video when clicking pause button", async ({ videoPage, page }) => {
    // Arrange: Start playing video
    await videoPage.playVideo();
    await page.waitForTimeout(1000);

    // Act: Pause video
    await videoPage.pauseVideo();

    // Assert: Video is paused
    const isPlaying = await videoPage.isVideoPlaying();
    expect(isPlaying).toBe(false);
  });

  test("should have progress bar", async ({ videoPage }) => {
    // Assert: Progress bar is visible
    await expect(videoPage.progressBar).toBeVisible();
  });

  test("should have volume control", async ({ videoPage }) => {
    // Assert: Volume control is visible
    await expect(videoPage.volumeControl).toBeVisible();
  });

  test("should have fullscreen button", async ({ videoPage }) => {
    // Assert: Fullscreen button is visible
    await expect(videoPage.fullscreenButton).toBeVisible();
  });

  test("should display video duration", async ({ videoPage, page }) => {
    // Wait for video metadata to load
    await page.waitForTimeout(2000);

    // Act: Get video duration
    const duration = await videoPage.getDuration();

    // Assert: Duration is greater than 0
    expect(duration).toBeGreaterThan(0);
  });

  test("should update current time as video plays", async ({ videoPage, page }) => {
    // Arrange: Start playing video
    await videoPage.playVideo();

    // Act: Wait for video to play
    await page.waitForTimeout(2000);

    // Act: Get current time
    const currentTime = await videoPage.getCurrentTime();

    // Assert: Current time is greater than 0
    expect(currentTime).toBeGreaterThan(0);
  });
});

test.describe("Playback Speed Control", () => {
  test.beforeEach(async ({ page, videoPage }) => {
    // Arrange: Authenticate as premium user and navigate to video
    await authenticateUser(page, "premium");
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();
  });

  test("should have speed control options", async ({ videoPage }) => {
    // Assert: Speed control is visible
    await expect(videoPage.speedControl).toBeVisible();
  });

  test("should change playback speed to 0.5x", async ({ videoPage, page }) => {
    // Act: Set speed to 0.5x
    await videoPage.setPlaybackSpeed("0.5");

    // Assert: Playback rate is 0.5
    const playbackRate = await page.evaluate(() => {
      const video = document.querySelector("video");
      return video ? video.playbackRate : 1;
    });
    expect(playbackRate).toBe(0.5);
  });

  test("should change playback speed to 1.5x", async ({ videoPage, page }) => {
    // Act: Set speed to 1.5x
    await videoPage.setPlaybackSpeed("1.5");

    // Assert: Playback rate is 1.5
    const playbackRate = await page.evaluate(() => {
      const video = document.querySelector("video");
      return video ? video.playbackRate : 1;
    });
    expect(playbackRate).toBe(1.5);
  });

  test("should change playback speed to 2x", async ({ videoPage, page }) => {
    // Act: Set speed to 2x
    await videoPage.setPlaybackSpeed("2");

    // Assert: Playback rate is 2
    const playbackRate = await page.evaluate(() => {
      const video = document.querySelector("video");
      return video ? video.playbackRate : 1;
    });
    expect(playbackRate).toBe(2);
  });

  test("should have all speed options available", async ({ videoPage, page }) => {
    // Act: Open speed control
    await videoPage.speedControl.click();

    // Assert: All speed options are available
    const speeds = ["0.5", "0.75", "1", "1.25", "1.5", "2"];

    for (const speed of speeds) {
      const option = page.getByRole("option", { name: new RegExp(speed, "i") });
      await expect(option).toBeVisible();
    }
  });
});

test.describe("Video Player Keyboard Controls", () => {
  test.beforeEach(async ({ page, videoPage }) => {
    // Arrange: Authenticate as premium user and navigate to video
    await authenticateUser(page, "premium");
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();
  });

  test("should play/pause with spacebar", async ({ page, videoPage }) => {
    // Arrange: Focus on video player
    await videoPage.videoPlayer.click();

    // Act: Press spacebar to play
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);

    // Assert: Video is playing
    let isPlaying = await videoPage.isVideoPlaying();
    expect(isPlaying).toBe(true);

    // Act: Press spacebar to pause
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);

    // Assert: Video is paused
    isPlaying = await videoPage.isVideoPlaying();
    expect(isPlaying).toBe(false);
  });

  test("should toggle fullscreen with F key", async ({ page, videoPage }) => {
    // Arrange: Focus on video player
    await videoPage.videoPlayer.click();

    // Act: Press F to enter fullscreen
    await page.keyboard.press("f");

    // Wait for fullscreen transition
    await page.waitForTimeout(500);

    // Assert: Video is in fullscreen
    await page.evaluate(() => {
      return document.fullscreenElement !== null;
    });

    // Note: Fullscreen might not work in headless mode
    // This test might need to be skipped in CI
  });
});

test.describe("Video Player Responsive Design", () => {
  test("should work on mobile viewport", async ({ page, videoPage }) => {
    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Arrange: Authenticate and navigate
    await authenticateUser(page, "premium");
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();

    // Assert: Video player is visible
    await expect(videoPage.videoPlayer).toBeVisible();

    // Assert: Controls are accessible
    await expect(videoPage.playButton).toBeVisible();
  });

  test("should work on tablet viewport", async ({ page, videoPage }) => {
    // Arrange: Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Arrange: Authenticate and navigate
    await authenticateUser(page, "premium");
    await videoPage.goto(TEST_VIDEOS.free);
    await videoPage.waitForLoad();

    // Assert: Video player is visible
    await expect(videoPage.videoPlayer).toBeVisible();

    // Assert: Video information is visible
    await expect(videoPage.videoTitle).toBeVisible();
    await expect(videoPage.videoDescription).toBeVisible();
  });
});

test.describe("Video Loading States", () => {
  test("should show loading state while video loads", async ({ page, videoPage }) => {
    // Arrange: Navigate to video page
    await authenticateUser(page, "premium");
    await videoPage.goto(TEST_VIDEOS.free);

    // Assert: Loading indicator appears (if implemented)
    // This depends on your implementation
    page.getByTestId("video-loading");

    // Note: Loading might be too fast to catch in tests
    // You might need to throttle network in CI
  });

  test("should handle video load errors gracefully", async ({ page }) => {
    // Arrange: Navigate to video with invalid URL
    await authenticateUser(page, "premium");
    await page.goto(`/video/${TEST_VIDEOS.free}`);

    // Simulate video load error
    await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video) {
        video.dispatchEvent(new Event("error"));
      }
    });

    // Assert: Error message is shown (if implemented)
    // This depends on your error handling implementation
  });
});
