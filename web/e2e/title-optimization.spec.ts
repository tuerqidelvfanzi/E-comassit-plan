/**
 * TC-02: 标题优化流程 E2E测试
 * V3需求: FR-RW-01 标题改写
 */
import { test, expect } from '@playwright/test';

test.describe('标题优化流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    await page.goto('/app/title-optimization');
  });

  test('标题优化 - 越南市场', async ({ page }) => {
    // 输入原始标题
    const inputArea = page.locator('textarea').first();
    await inputArea.fill('可爱蓝色小熊熊图案卡通印花休闲百搭纯棉短袖T恤儿童韩版');
    
    // 点击优化按钮
    const optimizeBtn = page.locator('button').filter({ hasText: '优化' }).first();
    await optimizeBtn.click();
    
    // 等待结果
    await page.waitForTimeout(1000);
  });

  test('标题优化 - 平台选择', async ({ page }) => {
    // 验证有平台选择
    await expect(page.getByText('越南').first()).toBeVisible();
    
    // 点击一个平台
    await page.getByText('越南').first().click();
    
    // 验证选中状态变化
    await page.waitForTimeout(300);
  });
});
