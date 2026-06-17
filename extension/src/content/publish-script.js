/**
 * 电商助手 - 发布填表 Script v3.1
 * 用于 Shopee/TikTok 卖家后台
 */
(function() {
  'use strict';

  // 平台检测
  function detectPlatform() {
    var host = location.hostname;
    if (host.includes('shopee')) return 'shopee';
    if (host.includes('tiktok')) return 'tiktok';
    return 'unknown';
  }

  // Shopee 卖家后台选择器
  var SHOPEE_SELECTORS = {
    title: [
      'input[name="name"]',
      'input[placeholder*="产品名称"]',
      'input[placeholder*="标题"]',
      'textarea[name="description"]'
    ],
    price: [
      'input[name="price"]',
      'input[placeholder*="价格"]',
      'input[placeholder*="Price"]'
    ],
    stock: [
      'input[name="stock"]',
      'input[placeholder*="库存"]',
      'input[placeholder*="Stock"]'
    ],
    images: [
      'input[type="file"][accept*="image"]',
      '[class*="upload"] input[type="file"]'
    ]
  };

  // TikTok 卖家后台选择器
  var TIKTOK_SELECTORS = {
    title: [
      'input[placeholder*="Product name"]',
      'input[placeholder*="产品名称"]',
      'textarea[name="description"]'
    ],
    price: [
      'input[placeholder*="Price"]',
      'input[name="price"]'
    ],
    stock: [
      'input[placeholder*="Stock"]',
      'input[name="stock"]'
    ]
  };

  // 获取选择器
  function getSelectors() {
    var platform = detectPlatform();
    if (platform === 'shopee') return SHOPEE_SELECTORS;
    if (platform === 'tiktok') return TIKTOK_SELECTORS;
    return SHOPEE_SELECTORS;
  }

  // 填充表单
  function fillForm(data) {
    var selectors = getSelectors();
    var results = { filled: [], failed: [] };

    console.log('[Publish] 开始填表:', data);

    // 填充标题
    var titleEls = document.querySelectorAll(selectors.title.join(','));
    for (var i = 0; i < titleEls.length; i++) {
      var el = titleEls[i];
      if (!el.disabled && !el.readOnly) {
        el.value = data.title || data.vietnameseTitle || '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        results.filled.push('title');
        break;
      }
    }

    // 填充价格
    var priceEls = document.querySelectorAll(selectors.price.join(','));
    for (var j = 0; j < priceEls.length; j++) {
      var pel = priceEls[j];
      if (!pel.disabled && !pel.readOnly) {
        var price = data.price || 0;
        pel.value = price;
        pel.dispatchEvent(new Event('input', { bubbles: true }));
        pel.dispatchEvent(new Event('change', { bubbles: true }));
        results.filled.push('price');
        break;
      }
    }

    // 填充库存
    var stockEls = document.querySelectorAll(selectors.stock.join(','));
    for (var k = 0; k < stockEls.length; k++) {
      var sel = stockEls[k];
      if (!sel.disabled && !sel.readOnly) {
        sel.value = data.stock || 99;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        results.filled.push('stock');
        break;
      }
    }

    console.log('[Publish] 填表结果:', results);
    return results;
  }

  // 显示填表状态
  function showFillStatus(results) {
    var toast = document.createElement('div');
    toast.id = 'ecomassist-fill-status';
    toast.style.cssText = 'position:fixed;top:80px;right:20px;background:white;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);padding:16px;z-index:2147483647;font-family:system-ui,sans-serif;min-width:200px;';
    toast.innerHTML = '<div style="font-weight:600;margin-bottom:8px;">填表结果</div>' +
      '<div style="color:#10b981;">✓ 已填充: ' + results.filled.join(', ') + '</div>' +
      (results.failed.length > 0 ? '<div style="color:#ef4444;">✗ 失败: ' + results.failed.join(', ') + '</div>' : '') +
      '<div style="margin-top:8px;font-size:12px;color:#666;">' + detectPlatform() + '</div>';
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  }

  // 添加工具栏
  function addToolbar() {
    if (document.getElementById('ecomassist-publish-btn')) return;

    var btn = document.createElement('div');
    btn.id = 'ecomassist-publish-btn';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    btn.title = '电商助手 - 填表';
    btn.style.cssText = 'position:fixed;top:20px;right:20px;width:44px;height:44px;background:#10b981;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 10px rgba(16,185,129,.4);z-index:2147483647;';
    btn.onclick = async function() {
      try {
        var result = await chrome.runtime.sendMessage({ type: 'GET_PRODUCT' });
        if (result && result.success && result.data) {
          var fillResult = fillForm(result.data);
          showFillStatus(fillResult);
        } else {
          alert('请先在发布中心准备填表数据');
        }
      } catch (e) {
        alert('获取填表数据失败: ' + e.message);
      }
    };
    document.body.appendChild(btn);
  }

  // 监听消息
  chrome.runtime.onMessage.addListener(function(msg, s, sendResponse) {
    console.log('[Publish] 消息:', msg.type);
    switch (msg.type) {
      case 'FILL_FORM':
      case 'FILL_FORM_DATA':
        var result = fillForm(msg.data);
        sendResponse(result);
        break;
      case 'GET_PLATFORM':
        sendResponse({ platform: detectPlatform() });
        break;
      default:
        sendResponse({ error: 'unknown' });
    }
    return true;
  });

  // 初始化
  if (document.readyState === 'complete') {
    setTimeout(addToolbar, 1000);
  } else {
    window.addEventListener('load', function() { setTimeout(addToolbar, 1000); });
  }

  console.log('[Publish] 电商助手发布脚本 v3.1 - 平台:', detectPlatform());
})();
