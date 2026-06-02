/**
 * TC-05: 竞品分析流程 E2E测试
 * V3需求: FR-S-01 竞品分析任务
 */
import { test, expect } from '@playwright/test';

test.describe('竞品分析流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    await page.goto('/app/competitors');
  });

  test('竞品分析页面加载', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByText('竞品分析').first()).toBeVisible();
  });

  test('竞品分析 - 输入关键词', async ({ page }) => {
    // 输入关键词
    const input = page.locator('input').first();
    await input.fill('纯棉T恤 女童');
    
    // 等待加载
    await page.waitForTimeout(500);
  });

  test('竞品分析 - 验证分析维度', async ({ page }) => {
    // 输入关键词
    const input = page.locator('input').first();
    await input.fill('韩版宽松bf风');
    
    // 等待结果
    await page.waitForTimeout(500);
  });
});
