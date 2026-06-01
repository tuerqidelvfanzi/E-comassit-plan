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
  // 等待导航加载
  await page.waitForSelector('aside nav', { timeout: 10000 });
  // 使用更简单的选择器
  await page.locator('aside nav a', { hasText: '采集箱' }).click();
  await expect(page).toHaveURL(/\/app\/inbox/);
  await expect(page.getByRole('heading', { name: '采集箱' })).toBeVisible();
});
