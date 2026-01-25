import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Home Page
 * Handles video browsing, filtering, and navigation
 */
export class HomePage {
  readonly page: Page;
  readonly navbar: Locator;
  readonly loginButton: Locator;
  readonly userAvatar: Locator;
  readonly logoutButton: Locator;
  readonly filterBar: Locator;
  readonly categoryButtons: Locator;
  readonly levelSelect: Locator;
  readonly clearFiltersButton: Locator;
  readonly videoGrid: Locator;
  readonly videoCards: Locator;
  readonly premiumBadges: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navbar elements
    this.navbar = page.locator("nav");
    this.loginButton = page.getByRole("button", { name: /zaloguj się/i });
    this.userAvatar = page.locator('[aria-label="Menu użytkownika"]');
    this.logoutButton = page.getByRole("menuitem", { name: /wyloguj/i });

    // Filter elements
    this.filterBar = page.locator('[role="search"]');
    this.categoryButtons = page.locator('[role="group"][aria-label*="kategorii"] button');
    this.levelSelect = page.getByRole("combobox", { name: /poziom trudności/i });
    this.clearFiltersButton = page.getByRole("button", { name: /wyczyść filtry/i });

    // Video grid elements
    this.videoGrid = page.getByTestId("video-grid");
    this.videoCards = page.getByTestId("video-card");
    this.premiumBadges = page.getByTestId("premium-badge");
  }

  async goto() {
    await this.page.goto("/");
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async filterByCategory(category: string) {
    await this.page.getByRole("button", { name: new RegExp(`Filtruj po kategorii: ${category}`, "i") }).click();
  }

  async filterByLevel(level: string) {
    await this.levelSelect.click();
    await this.page.getByRole("option", { name: new RegExp(level, "i") }).click();
  }

  async clearFilters() {
    await this.clearFiltersButton.click();
  }

  async getVideoCardCount() {
    return await this.videoCards.count();
  }

  async getPremiumBadgeCount() {
    return await this.premiumBadges.count();
  }

  async clickVideoCard(index = 0) {
    await this.videoCards.nth(index).click();
  }

  async getVideoCardTitle(index = 0) {
    return await this.videoCards.nth(index).getByTestId("video-title").textContent();
  }

  async isUserLoggedIn() {
    return await this.userAvatar.isVisible();
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async logout() {
    await this.userAvatar.click();
    await this.logoutButton.click();
  }

  async getUserRole() {
    await this.userAvatar.click();
    const badge = this.page.getByTestId("user-role-badge");
    return await badge.textContent();
  }

  async hasActiveFilter(category?: string) {
    if (category) {
      const button = this.page.getByRole("button", { name: new RegExp(`Filtruj po kategorii: ${category}`, "i") });
      return (await button.getAttribute("aria-pressed")) === "true";
    }
    return await this.clearFiltersButton.isVisible();
  }
}
