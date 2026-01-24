import { test as base } from "@playwright/test";
import { HomePage } from "./page-objects/HomePage";

/**
 * Extend base test with custom fixtures
 * This allows us to reuse page objects across tests
 */
interface MyFixtures {
  homePage: HomePage;
}

export const test = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
});

export { expect } from "@playwright/test";
