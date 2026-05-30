import { test, expect } from '@playwright/test';

test('login and open dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();
});

test('navigate to inbox', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await page.locator('aside nav').getByRole('link', { name: '采集箱', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/inbox/);
  await expect(page.getByRole('heading', { name: '采集箱' })).toBeVisible();
});
