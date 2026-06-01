// 临时测试脚本
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3004/login');
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL(/\/app/);
  
  // 等待导航加载
  await page.waitForSelector('aside nav', { timeout: 10000 });
  
  // 打印所有链接
  const links = await page.locator('aside nav a').all();
  console.log('Found', links.length, 'links in nav:');
  for (const link of links) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(' -', text?.trim(), '->', href);
  }
  
  await browser.close();
})();
