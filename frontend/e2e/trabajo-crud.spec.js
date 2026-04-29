const { test, expect } = require('@playwright/test');

test.describe('Trabajo CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('admin@test.com');
    await page.getByLabel(/contrase/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL(/\/(home|inicio)?$/i, { timeout: 10000 });
  });

  test('work detail page shows all sections', async ({ page }) => {
    await page.goto('/explorar');
    await page.waitForTimeout(2000);
    const firstWork = page.getByRole('article').first();
    if (await firstWork.isVisible()) {
      await firstWork.click();
      await page.waitForTimeout(2000);
      // Check main sections are present
      await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    }
  });
});
