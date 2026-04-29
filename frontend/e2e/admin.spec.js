const { test, expect } = require('@playwright/test');

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('admin@test.com');
    await page.getByLabel(/contrase/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL(/\/(home|inicio)?$/i, { timeout: 10000 });
  });

  test('admin dashboard loads for authorized user', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(3000);
    // Should see dashboard content, not redirect
    const heading = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('user management page loads', async ({ page }) => {
    await page.goto('/admin/usuarios');
    await page.waitForTimeout(3000);
    const heading = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });
});
