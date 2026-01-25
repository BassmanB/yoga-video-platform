import { test as base } from "@playwright/test";
import { HomePage } from "../page-objects/HomePage";
import { VideoPage } from "../page-objects/VideoPage";
import { AuthPage } from "../page-objects/AuthPage";

/**
 * Extend base test with custom fixtures
 * This allows us to reuse page objects across tests
 */
interface MyFixtures {
  homePage: HomePage;
  videoPage: VideoPage;
  authPage: AuthPage;
}

/**
 * Test user credentials for different roles
 * These should be set up in your test database
 */
export const TEST_USERS = {
  free: {
    email: process.env.TEST_USER_FREE_EMAIL || "test-free@example.com",
    role: "free",
  },
  premium: {
    email: process.env.TEST_USER_PREMIUM_EMAIL || "test-premium@example.com",
    role: "premium",
  },
  admin: {
    email: process.env.TEST_USER_ADMIN_EMAIL || "test-admin@example.com",
    role: "admin",
  },
};

/**
 * Test video IDs for different scenarios
 * These should exist in your test database
 */
export const TEST_VIDEOS = {
  free: process.env.TEST_VIDEO_FREE_ID || "free-video-id",
  premium: process.env.TEST_VIDEO_PREMIUM_ID || "premium-video-id",
};

export const test = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  videoPage: async ({ page }, use) => {
    const videoPage = new VideoPage(page);
    await use(videoPage);
  },

  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },
});

export { expect } from "@playwright/test";

/**
 * Helper function to authenticate a user via API
 * This is faster than going through the UI for tests that need auth
 */
export async function authenticateUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  userType: keyof typeof TEST_USERS
) {
  // This would typically call your auth API endpoint
  // For now, we'll use a placeholder that sets the auth cookie
  await page.context().addCookies([
    {
      name: "sb-access-token",
      value: process.env[`TEST_TOKEN_${userType.toUpperCase()}`] || "mock-token",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
