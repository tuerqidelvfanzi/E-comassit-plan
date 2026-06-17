import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

test.describe('移动端响应式', () => {
  for (const vp of VIEWPORTS) {
    test('登录页 @ ' + vp.name, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    });

    test('主题设置 @ ' + vp.name, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/app/settings/themes');
      await expect(page.getByText('选择主题风格').first()).toBeVisible();
    });
  }
});
