import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Video Detail Page
 * Handles video playback and premium content access
 */
export class VideoPage {
  readonly page: Page;
  readonly videoPlayer: Locator;
  readonly playButton: Locator;
  readonly pauseButton: Locator;
  readonly progressBar: Locator;
  readonly volumeControl: Locator;
  readonly fullscreenButton: Locator;
  readonly speedControl: Locator;
  readonly videoTitle: Locator;
  readonly videoDescription: Locator;
  readonly videoCategory: Locator;
  readonly videoLevel: Locator;
  readonly videoDuration: Locator;
  readonly premiumBadge: Locator;
  readonly accessDeniedMessage: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Video player elements
    this.videoPlayer = page.getByTestId("video-player");
    this.playButton = page.getByRole("button", { name: /play|odtwórz/i });
    this.pauseButton = page.getByRole("button", { name: /pause|pauza/i });
    this.progressBar = page.getByRole("slider", { name: /seek|postęp/i });
    this.volumeControl = page.getByRole("slider", { name: /volume|głośność/i });
    this.fullscreenButton = page.getByRole("button", { name: /fullscreen|pełny ekran/i });
    this.speedControl = page.getByTestId("speed-control");

    // Video info elements
    this.videoTitle = page.getByTestId("video-title");
    this.videoDescription = page.getByTestId("video-description");
    this.videoCategory = page.getByTestId("video-category");
    this.videoLevel = page.getByTestId("video-level");
    this.videoDuration = page.getByTestId("video-duration");
    this.premiumBadge = page.getByTestId("premium-badge");

    // Access control elements
    this.accessDeniedMessage = page.getByTestId("access-denied-message");
    this.backButton = page.getByRole("link", { name: /powrót|back/i });
  }

  async goto(videoId: string) {
    await this.page.goto(`/video/${videoId}`);
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async playVideo() {
    await this.playButton.click();
  }

  async pauseVideo() {
    await this.pauseButton.click();
  }

  async setPlaybackSpeed(speed: string) {
    await this.speedControl.click();
    await this.page.getByRole("option", { name: new RegExp(speed, "i") }).click();
  }

  async toggleFullscreen() {
    await this.fullscreenButton.click();
  }

  async isVideoPlaying() {
    // Check if video element is playing
    return await this.page.evaluate(() => {
      const video = document.querySelector("video");
      return video ? !video.paused : false;
    });
  }

  async getVideoTitle() {
    return await this.videoTitle.textContent();
  }

  async getVideoDescription() {
    return await this.videoDescription.textContent();
  }

  async isPremiumContent() {
    return await this.premiumBadge.isVisible();
  }

  async isAccessDenied() {
    return await this.accessDeniedMessage.isVisible();
  }

  async getAccessDeniedMessage() {
    return await this.accessDeniedMessage.textContent();
  }

  async goBack() {
    await this.backButton.click();
  }

  async getCurrentTime() {
    return await this.page.evaluate(() => {
      const video = document.querySelector("video");
      return video ? video.currentTime : 0;
    });
  }

  async getDuration() {
    return await this.page.evaluate(() => {
      const video = document.querySelector("video");
      return video ? video.duration : 0;
    });
  }
}
