import { test, expect } from '@playwright/test';

const THEMES = ['trello-premium', 'linear-dark', 'monday-vibrant', 'enterprise-classic'];

test.describe('主题视觉回归', () => {
  for (const theme of THEMES) {
    test('主题 ' + theme + ' 视觉快照', async ({ page }) => {
      await page.goto('/app');
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
        window.dispatchEvent(new Event('themechange'));
      }, theme);
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('theme-' + theme + '.png', {
        maxDiffPixelRatio: 0.05,
        fullPage: false,
      });
    });
  }
});
