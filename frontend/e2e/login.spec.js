const { test, expect } = require('@playwright/test');

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows login form with email and password fields', async ({ page }) => {
    await expect(page.getByLabel(/email|correo/i)).toBeVisible();
    await expect(page.getByLabel(/contrase/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar|login/i })).toBeVisible();
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/email|correo/i).fill('wrong@test.com');
    await page.getByLabel(/contrase/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('redirects to home after successful login', async ({ page }) => {
    // Uses test credentials - adapt to your test data
    await page.getByLabel(/email|correo/i).fill('admin@test.com');
    await page.getByLabel(/contrase/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL(/\/(home|inicio)?$/i, { timeout: 10000 });
  });

  test('protected routes redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/explorar');
    await expect(page).toHaveURL(/login/i, { timeout: 10000 });
  });
});
