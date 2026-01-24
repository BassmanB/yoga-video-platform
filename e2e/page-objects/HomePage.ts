import { Page } from '@playwright/test';

/**
 * Page Object Model for Home Page
 * Following Playwright best practices for maintainable tests
 */
export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle() {
    return await this.page.title();
  }

  async getURL() {
    return this.page.url();
  }
}
