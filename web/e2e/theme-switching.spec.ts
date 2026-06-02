/**
 * TC-04: 主题切换流程 E2E测试
 * V3需求: 主题系统 v2.0
 */
import { test, expect } from '@playwright/test';

test.describe('主题切换流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    await page.goto('/app/settings/themes');
  });

  test('主题设置页面加载', async ({ page }) => {
    // 验证有主题风格标题
    await expect(page.getByText('选择主题风格')).toBeVisible();
    
    // 验证有主题卡片（4个预设主题）
    const themeCards = page.locator('button').filter({ hasText: '高级风' });
    await expect(themeCards.first()).toBeVisible();
  });

  test('主题卡片选择', async ({ page }) => {
    // 点击 Linear 极客风主题卡片
    const linearCard = page.getByText('Linear 极客风');
    await linearCard.click();
    
    // 验证状态更新
    await expect(page.getByText('当前主题：Linear 极客风')).toBeVisible();
  });

  test('配色微调器展开', async ({ page }) => {
    // 点击展开按钮
    await page.getByRole('button', { name: '展开' }).click();
    
    // 验证颜色选择器出现
    await expect(page.getByText('主色调')).toBeVisible();
    await expect(page.locator('input[type="color"]').first()).toBeVisible();
  });
});
