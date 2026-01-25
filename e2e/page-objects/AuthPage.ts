import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Authentication
 * Handles login/logout flows
 */
export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly magicLinkMessage: Locator;
  readonly errorMessage: Locator;
  readonly loginForm: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.submitButton = page.getByRole("button", { name: /wyślij|send|zaloguj/i });
    this.magicLinkMessage = page.getByTestId("magic-link-message");
    this.errorMessage = page.getByTestId("auth-error-message");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async isMagicLinkSent() {
    return await this.magicLinkMessage.isVisible();
  }

  async getMagicLinkMessage() {
    return await this.magicLinkMessage.textContent();
  }

  async hasError() {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  /**
   * Simulate magic link click by directly navigating to the callback URL
   * In real tests, you would intercept the email and extract the link
   */
  async simulateMagicLinkClick(token: string) {
    await this.page.goto(`/auth/callback?token=${token}`);
  }
}
