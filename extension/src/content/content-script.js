/**
 * 电商助手 Chrome Extension - Content Script
 * V3.0 功能: 采集商品数据 / 填表
 */

(function() {
  'use strict';

  // 1688商品详情页选择器
  const SELECTORS_1688 = {
    title: '.title-text h1, .ma-title, h1.title',
    price: '.price-value, .ma-ref-price, .price',
    images: '.main-image img, .vertical-img img, .image-viewer img',
    skuList: '.sku-list .sku-item, .spec-list .spec-item',
    description: '.description-content, .product-detail',
    attributes: '.product-attr-list li, .attr-list li',
  };

  // 淘宝/天猫商品详情页选择器
  const SELECTORS_TAOBAO = {
    title: '.tb-item-title h1, .ItemHeader--title--eUbQa5jP, h1[data-spm="100"]',
    price: '.tb-price span, .price-wrapper, [class*="price"]',
    images: '.tb-gallery img, .main-img img, [class*="mainPic"] img',
    skuList: '.tb-sku .sku-item, .sku-wrapper .sku',
    description: '#description, .description',
    attributes: '.attributes li, .p-property li',
  };

  // 检测当前平台
  function detectPlatform() {
    const url = window.location.hostname;
    if (url.includes('1688.com')) return '1688';
    if (url.includes('tmall.com')) return '天猫';
    if (url.includes('taobao.com')) return '淘宝';
    if (url.includes('yangkeduo.com') || url.includes('pinduoduo')) return '拼多多';
    return 'unknown';
  }

  // 获取选择器
  function getSelectors() {
    const platform = detectPlatform();
    if (platform === '1688') return SELECTORS_1688;
    if (platform === '天猫' || platform === '淘宝') return SELECTORS_TAOBAO;
    return SELECTORS_1688; // 默认
  }

  // 采集商品数据
  function captureProduct() {
    const platform = detectPlatform();
    const selectors = getSelectors();

    const title = document.querySelector(selectors.title)?.textContent?.trim() || '';
    const priceText = document.querySelector(selectors.price)?.textContent?.trim() || '0';
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

    const images = [];
    document.querySelectorAll(selectors.images).forEach(img => {
      if (img.src && !img.src.includes('data:')) {
        images.push(img.src.replace('_50x50', '').replace('_100x100', ''));
      }
    });

    const skus = [];
    document.querySelectorAll(selectors.skuList).forEach(item => {
      const color = item.querySelector('.color-name, .sku-name')?.textContent?.trim() || '';
      const size = item.querySelector('.size-name, .size')?.textContent?.trim() || '';
      if (color || size) {
        skus.push({ color, size, price, stock: 99 });
      }
    });

    const attributes = {};
    document.querySelectorAll(selectors.attributes).forEach(item => {
      const text = item.textContent?.trim() || '';
      const [key, ...valueParts] = text.split(':');
      if (key && valueParts.length) {
        attributes[key.trim()] = valueParts.join(':').trim();
      }
    });

    return {
      title,
      price,
      source: platform,
      sourceUrl: window.location.href,
      images: images.slice(0, 9),
      skus,
      skuCount: skus.length || 1,
      attributes,
      capturedAt: new Date().toISOString(),
    };
  }

  // 填充表单数据
  function fillForm(data) {
    console.log('[Content] 填充表单:', data);

    // 尝试填充标题
    const titleInputs = document.querySelectorAll('input[placeholder*="标题"], input[name*="title"], textarea[name*="title"]');
    titleInputs.forEach(input => {
      if (!input.value || input.disabled) {
        input.value = data.title || data.vietnameseTitle || '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 尝试填充价格
    const priceInputs = document.querySelectorAll('input[placeholder*="价格"], input[name*="price"]');
    priceInputs.forEach(input => {
      if (!input.value || input.disabled) {
        input.value = data.price || '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 尝试填充库存
    const stockInputs = document.querySelectorAll('input[placeholder*="库存"], input[name*="stock"]');
    stockInputs.forEach(input => {
      if (!input.value || input.disabled) {
        input.value = data.stock || 50;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    return { success: true, filled: ['title', 'price', 'stock'] };
  }

  // 监听来自background/popup的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Content] 收到消息:', message.type);

    switch (message.type) {
      case 'GET_PAGE_DATA':
        sendResponse(captureProduct());
        break;

      case 'CAPTURE_PAGE':
        sendResponse({ success: true, data: captureProduct() });
        break;

      case 'FILL_FORM':
      case 'FILL_FORM_DATA':
        sendResponse(fillForm(message.data));
        break;

      default:
        sendResponse({ error: '未知消息类型' });
    }

    return true; // 异步响应
  });

  // 添加工具栏悬浮按钮
  function addToolbarButton() {
    if (document.getElementById('ecomassist-toolbar-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'ecomassist-toolbar-btn';
    btn.innerHTML = '📦';
    btn.title = '电商助手 - 采集商品';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #e94560, #533483);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
      z-index: 999999;
      transition: transform 0.2s;
    `;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
    });
    
    btn.addEventListener('click', async () => {
      const data = captureProduct();
      // 发送到popup
      chrome.runtime.sendMessage({
        type: 'CAPTURE_RESULT',
        data: data
      });
      // 显示采集提示
      alert('商品已采集!\n\n标题: ' + data.title.substring(0, 30) + '...\n价格: ¥' + data.price);
    });

    document.body.appendChild(btn);
  }

  // 页面加载完成后添加工具栏按钮
  if (document.readyState === 'complete') {
    addToolbarButton();
  } else {
    window.addEventListener('load', addToolbarButton);
  }

  console.log('[Content] 商品助手 Content Script 已加载');
})();
