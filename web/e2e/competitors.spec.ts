/**
 * TC-05: 竞品分析流程 E2E测试
 * V3需求: FR-S-01 竞品分析任务
 */
import { test, expect } from '@playwright/test';

test.describe('竞品分析流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '登录' }).click();
    await page.goto('/app/competitors');
  });

  test('竞品分析页面加载', async ({ page }) => {
    // 验证页面标题使用heading
    await expect(page.getByRole('heading', { name: '竞品分析' })).toBeVisible();
    
    // 验证有输入框
    await expect(page.locator('input[placeholder*="关键词"]')).toBeVisible();
    
    // 验证有开始分析按钮
    await expect(page.getByText('开始分析')).toBeVisible();
  });

  test('竞品分析 - 输入关键词', async ({ page }) => {
    // 输入关键词
    const input = page.locator('input[placeholder*="关键词"]');
    await input.fill('纯棉T恤 女童');
    
    // 点击开始分析按钮
    await page.getByText('开始分析').click();
    
    // 等待分析完成
    await page.waitForSelector('text=高频关键词', { timeout: 10000 });
    
    // 验证分析结果出现（使用first()避免strict mode）
    await expect(page.getByText('热门颜色').first()).toBeVisible();
  });

  test('竞品分析 - 验证分析维度', async ({ page }) => {
    // 输入关键词并分析
    const input = page.locator('input[placeholder*="关键词"]');
    await input.fill('韩版宽松bf风街头潮流字母印花短袖T恤男款');
    
    await page.getByText('开始分析').click();
    
    // 等待分析结果
    await page.waitForSelector('text=高频关键词', { timeout: 10000 });
    
    // 验证有竞品列表
    await expect(page.getByText('TOP竞品列表')).toBeVisible({ timeout: 5000 });
  });
});
