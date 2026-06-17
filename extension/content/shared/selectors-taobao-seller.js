/** 与 shared/selectors/taobao-seller.json 同步 · 淘宝卖家中心 DOM */
globalThis.PSA_TAOBAO_SELLER_SELECTORS = {
  version: '1.0.0',
  platform: 'taobao',
  title: [
    '#sell-field-title input',
    '#sell-field-title textarea',
    'input[name="title"]',
    'input[name="itemTitle"]',
    '.sell-component-title input',
    '.sell-component-title textarea',
    '[data-spm-anchor-id*="title"] input',
    'div[class*="Title"] input[type="text"]',
    '#struct-title input',
  ],
  price: [
    '#sell-field-price input',
    'input[name="price"]',
    'input[name="itemPrice"]',
    '.sell-component-price input',
    '[class*="price"] input[type="text"]',
    '#struct-price input',
  ],
  stock: ['input[name="quantity"]', '#sell-field-quantity input', '.sell-component-stock input'],
};
