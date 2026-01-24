# E2E Test Examples

Uncomment and modify these examples as needed for your application.

## Authentication Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign up', async ({ page }) => {
    await page.goto('/signup');
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /sign up/i }).click();
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('user can login', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /log in/i }).click();
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('user can logout', async ({ page }) => {
    // Assuming user is already logged in
    await page.goto('/dashboard');
    
    await page.getByRole('button', { name: /logout/i }).click();
    
    await expect(page).toHaveURL(/.*login/);
  });
});
```

## Navigation Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('can navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /about/i }).click();
    await expect(page).toHaveURL(/.*about/);
    
    await page.getByRole('link', { name: /contact/i }).click();
    await expect(page).toHaveURL(/.*contact/);
  });
});
```

## Form Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('can submit contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByLabel(/name/i).fill('John Doe');
    await page.getByLabel(/email/i).fill('john@example.com');
    await page.getByLabel(/message/i).fill('This is a test message');
    
    await page.getByRole('button', { name: /send/i }).click();
    
    await expect(page.getByText(/message sent/i)).toBeVisible();
  });

  test('shows validation errors', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByRole('button', { name: /send/i }).click();
    
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });
});
```

## API Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
  test('GET /api/videos returns videos', async ({ request }) => {
    const response = await request.get('/api/videos');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const videos = await response.json();
    expect(Array.isArray(videos)).toBeTruthy();
  });

  test('POST /api/videos creates a video', async ({ request }) => {
    const response = await request.post('/api/videos', {
      data: {
        title: 'Test Video',
        description: 'Test Description',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);
    
    const video = await response.json();
    expect(video.title).toBe('Test Video');
  });
});
```

## Visual Regression Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('homepage matches screenshot', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('mobile viewport matches screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });
});
```
