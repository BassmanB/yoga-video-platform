# E2E Tests

End-to-end tests using Playwright.

## Structure

- `page-objects/` - Page Object Models for maintainable tests
- `fixtures/` - Custom test fixtures and helpers
- `*.spec.ts` - Test specifications

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View last report
npm run test:e2e:report
```

## Best Practices

1. Use Page Object Model pattern
2. Isolate tests with browser contexts
3. Use semantic locators (roles, labels)
4. Leverage fixtures for reusable setup
5. Enable traces for debugging failures
