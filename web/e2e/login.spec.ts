/**
 * TC-01: 登录流程 E2E测试
 */
import { test, expect } from '@playwright/test';

test.describe('登录流程', () => {
  test('登录页面加载', async ({ page }) => {
    await page.goto('/login');
    
    // 验证登录表单元素
    await expect(page.getByText('电商AI助手').first()).toBeVisible();
    await expect(page.getByText('邮箱登录').first()).toBeVisible();
    await expect(page.getByText('手机登录').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('登录模式切换', async ({ page }) => {
    await page.goto('/login');
    
    // 默认是邮箱登录模式
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // 点击手机登录
    await page.getByText('手机登录').first().click();
    
    // 验证切换到手机模式
    await expect(page.locator('input[type="tel"]')).toBeVisible();
  });

  test('页面标题验证', async ({ page }) => {
    await page.goto('/login');
    
    // 验证页面标题
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
