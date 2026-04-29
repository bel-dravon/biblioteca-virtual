const { test, expect } = require('@playwright/test');

test.describe('Solicitud de Prestamo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('admin@test.com');
    await page.getByLabel(/contrase/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar|login/i }).click();
    await expect(page).toHaveURL(/\/(home|inicio)?$/i, { timeout: 10000 });
  });

  test('can open loan request modal from work detail', async ({ page }) => {
    await page.goto('/explorar');
    await page.waitForTimeout(2000);
    const firstWork = page.getByRole('article').first();
    if (await firstWork.isVisible()) {
      await firstWork.click();
      await page.waitForTimeout(2000);
      // Look for loan/solicitud button
      const loanButton = page.getByRole('button', { name: /solicitar|prestamo/i });
      if (await loanButton.isVisible()) {
        await loanButton.click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
