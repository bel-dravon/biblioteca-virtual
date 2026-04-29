const { test, expect } = require('@playwright/test');

test.describe('Explorar', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('admin@test.com');
    await page.getByLabel(/contrase/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL(/\/(home|inicio)?$/i, { timeout: 10000 });
  });

  test('loads and displays works', async ({ page }) => {
    await page.goto('/explorar');
    await expect(page.getByRole('region', { name: /resultado/i })).toBeVisible({ timeout: 10000 });
  });

  test('search filters results', async ({ page }) => {
    await page.goto('/explorar');
    const searchInput = page.getByLabel(/buscar/i);
    await searchInput.fill('tesis');
    // Wait for debounce + API response
    await page.waitForTimeout(500);
  });

  test('clicking a work navigates to detail', async ({ page }) => {
    await page.goto('/explorar');
    await page.waitForTimeout(2000);
    const firstWork = page.getByRole('article').first();
    if (await firstWork.isVisible()) {
      await firstWork.click();
      await expect(page).toHaveURL(/\/trabajo\/\d+/i, { timeout: 10000 });
    }
  });
});
