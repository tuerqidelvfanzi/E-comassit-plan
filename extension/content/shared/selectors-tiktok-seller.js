/** TikTok Shop 卖家中心 DOM（演示 · 随平台改版需更新） */
globalThis.PSA_TIKTOK_SELLER_SELECTORS = {
  version: '1.0.0',
  platform: 'tiktok',
  title: [
    'input[name*="title" i]',
    'textarea[name*="title" i]',
    '[data-testid*="title"] input',
    'input[placeholder*="Title" i]',
    'input[placeholder*="标题" i]',
  ],
  price: [
    'input[name*="price" i]',
    'input[type="number"][placeholder*="price" i]',
    'input[placeholder*="价格" i]',
  ],
  stock: ['input[name*="stock" i]', 'input[name*="quantity" i]'],
  brand: ['input[name*="brand" i]', 'input[placeholder*="品牌" i]', 'input[placeholder*="Brand" i]'],
};
