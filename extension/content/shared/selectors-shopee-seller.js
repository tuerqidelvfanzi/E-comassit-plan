/** Shopee 卖家中心 DOM（演示 · 随平台改版需更新） */
globalThis.PSA_SHOPEE_SELLER_SELECTORS = {
  version: '1.0.0',
  platform: 'shopee',
  title: [
    'input[name*="title" i]',
    'textarea[name*="title" i]',
    '[data-testid*="title"] input',
    '[data-testid*="title"] textarea',
    'input[placeholder*="标题" i]',
    'input[placeholder*="title" i]',
  ],
  price: [
    'input[name*="price" i]',
    'input[placeholder*="价格" i]',
    'input[placeholder*="Price" i]',
  ],
  stock: ['input[name*="stock" i]', 'input[name*="quantity" i]', 'input[placeholder*="库存" i]'],
  shortDescription: ['textarea[name*="description" i]', 'textarea[placeholder*="描述" i]'],
};
