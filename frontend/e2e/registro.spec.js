const { test, expect } = require('@playwright/test');

test.describe('Registro', () => {
  test('shows registration form', async ({ page }) => {
    await page.goto('/registro');
    await expect(page.getByLabel(/nombre/i)).toBeVisible();
    await expect(page.getByLabel(/email|correo/i)).toBeVisible();
    await expect(page.getByLabel(/contrase/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /registr/i })).toBeVisible();
  });

  test('shows error for duplicate email', async ({ page }) => {
    await page.goto('/registro');
    await page.getByLabel(/nombre/i).first().fill('Test');
    await page.getByLabel(/apellido/i).first().fill('User');
    await page.getByLabel(/email|correo/i).fill('admin@test.com');
    await page.getByLabel(/contrase/i).first().fill('TestPass123!');
    await page.getByRole('button', { name: /registr/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });
});
