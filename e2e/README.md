# E2E Tests - Yoga Video Platform

This directory contains end-to-end tests for the Yoga Video Platform using Playwright.

## Test Structure

Tests are organized following the Page Object Model pattern for maintainability and reusability.

### Directory Structure

```
e2e/
├── page-objects/          # Page Object Models
│   ├── HomePage.ts        # Homepage interactions
│   ├── VideoPage.ts       # Video detail page interactions
│   └── AuthPage.ts        # Authentication interactions
├── fixtures/              # Test fixtures and helpers
│   └── index.ts          # Custom fixtures and test users
├── authentication.spec.ts # Auth flow tests
├── video-browsing.spec.ts # Video browsing and filtering tests
├── video-playback.spec.ts # Video player tests
├── premium-access.spec.ts # Premium content access control tests
└── README.md             # This file
```

## Test Coverage

### 1. Authentication Tests (`authentication.spec.ts`)

- ✅ Login/logout flows
- ✅ Magic link authentication
- ✅ User role display (free/premium/admin)
- ✅ Session persistence
- ✅ Keyboard navigation

**Covers:** US-05, US-06, US-07, FR-09 to FR-13

### 2. Video Browsing Tests (`video-browsing.spec.ts`)

- ✅ Video grid display
- ✅ Video card information
- ✅ Category filtering (Yoga, Mobilność, Kalistenika)
- ✅ Level filtering (Beginner, Intermediate, Advanced)
- ✅ Combined filters
- ✅ Clear filters functionality
- ✅ URL state management
- ✅ Responsive design (mobile/tablet)

**Covers:** US-01, US-02, US-03, US-04, FR-01 to FR-05

### 3. Video Playback Tests (`video-playback.spec.ts`)

- ✅ Video player controls (play, pause, progress, volume, fullscreen)
- ✅ Playback speed control (0.5x to 2x)
- ✅ Video information display
- ✅ Keyboard controls
- ✅ Responsive player
- ✅ Loading states and error handling

**Covers:** US-08, US-09, US-10, FR-06, FR-07

### 4. Premium Access Tests (`premium-access.spec.ts`)

- ✅ Premium content visibility for unauthenticated users
- ✅ Access control for free users
- ✅ Full access for premium users
- ✅ Admin access to all content
- ✅ Access denied messages
- ✅ Visual indicators (badges, blur effects)
- ✅ API security

**Covers:** US-04, US-10, US-11, FR-08, FR-18, FR-19

## Running Tests

### Prerequisites

1. Install dependencies:

```bash
npm install
```

2. Set up test environment variables in `.env.test`:

```env
# Test user credentials
TEST_USER_FREE_EMAIL=test-free@example.com
TEST_USER_PREMIUM_EMAIL=test-premium@example.com
TEST_USER_ADMIN_EMAIL=test-admin@example.com

# Test auth tokens (for API authentication)
TEST_TOKEN_FREE=your-free-user-token
TEST_TOKEN_PREMIUM=your-premium-user-token
TEST_TOKEN_ADMIN=your-admin-user-token

# Test video IDs
TEST_VIDEO_FREE_ID=free-video-uuid
TEST_VIDEO_PREMIUM_ID=premium-video-uuid
```

### Run All Tests

```bash
# Run all tests in headless mode
npm run test:e2e

# Run with UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test e2e/authentication.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

### Run Specific Test Suites

```bash
# Run only authentication tests
npx playwright test authentication

# Run only video browsing tests
npx playwright test video-browsing

# Run only video playback tests
npx playwright test video-playback

# Run only premium access tests
npx playwright test premium-access
```

### Generate Test Report

```bash
# Run tests and generate HTML report
npx playwright test --reporter=html

# Open the report
npx playwright show-report
```

## Test Data Setup

Before running tests, ensure you have:

1. **Test Users** in your Supabase database:
   - Free user with role: `free`
   - Premium user with role: `premium`
   - Admin user with role: `admin`

2. **Test Videos** in your database:
   - At least one free video (`is_premium = false`)
   - At least one premium video (`is_premium = true`)
   - Videos with different categories (yoga, mobility, calisthenics)
   - Videos with different levels (beginner, intermediate, advanced)

3. **Authentication Tokens**:
   - Generate valid auth tokens for each test user
   - Add them to `.env.test`

## Page Object Model

Tests use the Page Object Model pattern for better maintainability:

### HomePage

- Handles video browsing and filtering
- Manages navbar interactions
- Provides methods for user authentication state

### VideoPage

- Handles video player interactions
- Manages playback controls
- Provides access control verification

### AuthPage

- Handles login/logout flows
- Manages magic link authentication
- Provides session management

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Use Page Objects** for all page interactions
4. **Isolate tests** - each test should be independent
5. **Use fixtures** for common setup and teardown
6. **Test accessibility** - use semantic selectors (role, label)
7. **Handle async properly** - use proper waits
8. **Test responsive design** - include mobile/tablet viewports

## Debugging Tests

### Visual Debugging

```bash
# Run with trace on
npx playwright test --trace on

# Open trace viewer
npx playwright show-trace trace.zip
```

### Screenshots

Tests automatically capture screenshots on failure. Find them in:

```
test-results/
```

### Video Recording

Enable video recording in `playwright.config.ts`:

```typescript
use: {
  video: 'on-first-retry',
}
```

## CI/CD Integration

Tests are configured to run in CI with:

- Retry on failure (2 retries)
- Sequential execution (no parallel)
- HTML reporter
- Trace on first retry
- Screenshots on failure

Example GitHub Actions workflow:

```yaml
- name: Run Playwright tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Adding New Tests

1. Create a new spec file in `e2e/`
2. Import fixtures: `import { test, expect } from "./fixtures"`
3. Use Page Objects for interactions
4. Follow AAA pattern (Arrange, Act, Assert)
5. Add descriptive test names
6. Update this README with coverage information

Example:

```typescript
import { test, expect } from "./fixtures";

test.describe("Feature Name", () => {
  test("should do something specific", async ({ homePage }) => {
    // Arrange
    await homePage.goto();

    // Act
    await homePage.someAction();

    // Assert
    await expect(homePage.someElement).toBeVisible();
  });
});
```

## Troubleshooting

### Tests failing locally but passing in CI

- Check environment variables
- Ensure test database is properly seeded
- Verify auth tokens are valid

### Flaky tests

- Add proper waits (`waitForLoadState`, `waitForTimeout`)
- Use `toBeVisible()` before interacting with elements
- Check for race conditions

### Element not found

- Verify `data-testid` attributes exist in components
- Check if element is in viewport
- Ensure page is fully loaded

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
