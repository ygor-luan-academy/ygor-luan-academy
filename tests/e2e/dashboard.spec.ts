import { test, expect } from '@playwright/test';

test.describe('Proteção de rotas', () => {
  test('redireciona /dashboard para /login se não autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redireciona /admin para /login se não autenticado', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('página de login exibe formulário', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login com credenciais inválidas exibe erro', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalido@test.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=inválidos')).toBeVisible({ timeout: 5000 });
  });
});
