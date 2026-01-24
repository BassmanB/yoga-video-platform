# Testing Documentation

This document provides an overview of the testing infrastructure for the project.

## Tech Stack

- **Vitest** - Unit testing framework
- **Playwright** - E2E testing framework  
- **React Testing Library** - Component testing
- **jsdom** - DOM environment for unit tests

## Directory Structure

```
├── e2e/                          # E2E tests
│   ├── fixtures/                 # Custom Playwright fixtures
│   ├── page-objects/             # Page Object Models
│   └── *.spec.ts                 # E2E test specifications
├── src/test/                     # Unit & integration tests
│   ├── setup.ts                  # Global test setup
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── vitest.config.ts              # Vitest configuration
└── playwright.config.ts          # Playwright configuration
```

## Available Scripts

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with UI mode
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (visual test runner)
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

## Unit Testing Guidelines (Vitest)

### Best Practices

1. **Use descriptive test names** - Tests should clearly describe what they're testing
2. **Follow Arrange-Act-Assert pattern** - Structure tests for clarity
3. **Use `vi` object for mocks** - `vi.fn()`, `vi.spyOn()`, `vi.mock()`
4. **Leverage jsdom environment** - For DOM-based tests
5. **Use inline snapshots** - For readable assertions
6. **Enable watch mode during development** - For instant feedback

### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should return expected value', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Example Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<MyComponent onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## E2E Testing Guidelines (Playwright)

### Best Practices

1. **Use Page Object Model** - For maintainable tests
2. **Use browser contexts** - For test isolation
3. **Use semantic locators** - Roles, labels, test IDs
4. **Leverage fixtures** - For reusable test setup
5. **Enable traces** - For debugging failures
6. **Use visual comparisons** - `expect(page).toHaveScreenshot()`
7. **Run tests in parallel** - For faster execution

### Configuration

- **Browser**: Chromium only (Desktop Chrome)
- **Base URL**: http://localhost:4321
- **Auto-start dev server**: Yes
- **Traces**: On first retry
- **Screenshots**: On failure only

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('user can navigate to login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /login/i }).click();
  
  await expect(page).toHaveURL(/.*login/);
});
```

### Example with Page Object

```typescript
import { test } from './fixtures';

test('home page loads', async ({ homePage }) => {
  await homePage.goto();
  await homePage.waitForLoad();
  
  const title = await homePage.getTitle();
  expect(title).toBeTruthy();
});
```

## CI/CD Integration

The testing setup is optimized for CI environments:

- Vitest runs in CI mode automatically
- Playwright retries failed tests (2x in CI)
- Coverage reports can be generated
- HTML reports are generated for E2E tests

## Coverage

Coverage is configured for Vitest with the following exclusions:
- `node_modules/`
- `dist/`
- `.astro/`
- `e2e/`
- `**/*.config.{ts,js}`
- `**/*.d.ts`
- `**/types.ts`

Run `npm run test:coverage` to generate a coverage report.

## Debugging

### Vitest
- Use `test.only()` to run a single test
- Use `--watch` mode for instant feedback
- Use `--ui` mode for visual debugging
- Check console output for detailed error messages

### Playwright
- Use `--debug` flag to step through tests
- Use `--ui` mode for visual test runner
- Check traces in the HTML report
- Use `page.pause()` to debug at specific points

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
