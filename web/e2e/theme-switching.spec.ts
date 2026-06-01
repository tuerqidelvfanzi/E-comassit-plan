/**
 * TC-04: 主题切换流程 E2E测试
 * V3需求: FR-SYS-01 36种主题系统
 */
import { test, expect } from '@playwright/test';

test.describe('主题切换流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '登录' }).click();
    await page.goto('/app/settings/themes');
  });

  test('主题设置页面加载', async ({ page }) => {
    // 验证有主题选择器
    await expect(page.locator('select')).toBeVisible();
    
    // 验证有快速切换按钮
    const buttons = page.locator('button[class*="rounded"]');
    await expect(buttons.first()).toBeVisible();
  });

  test('主题下拉选择器选项', async ({ page }) => {
    // 打开下拉选择器
    const select = page.locator('select');
    await select.click();
    
    // 等待选项出现
    await page.waitForTimeout(300);
    
    // 验证有 optgroup（分类）
    const optgroups = page.locator('optgroup');
    const count = await optgroups.count();
    expect(count).toBeGreaterThan(0);
  });

  test('主题实时切换', async ({ page }) => {
    // 获取当前主题
    const select = page.locator('select');
    const initialValue = await select.inputValue();
    
    // 点击一个快速切换按钮
    const themeButtons = page.locator('button:has-text("极简白"), button:has-text("德古拉")');
    if (await themeButtons.count() > 0) {
      await themeButtons.first().click();
      await page.waitForTimeout(500);
      
      // 验证主题已切换
      const newValue = await select.inputValue();
      expect(newValue).not.toBe(initialValue);
    }
  });

  test('自定义CSS编辑器', async ({ page }) => {
    // 点击自定义CSS按钮（使用button role避免歧义）
    const customBtn = page.getByRole('button', { name: '自定义 CSS' });
    await customBtn.click();
    
    // 验证编辑器出现
    await expect(page.locator('textarea[aria-label*="CSS"]')).toBeVisible();
  });
});
