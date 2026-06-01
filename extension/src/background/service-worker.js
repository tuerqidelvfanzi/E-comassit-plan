/**
 * 电商助手 Chrome Extension - Background Service Worker
 * V3.0 功能: 采集、填表、通信
 */

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] 收到消息:', message.type);
  
  switch (message.type) {
    case 'CAPTURE_PAGE':
      handleCapturePage(sendResponse);
      return true; // 异步响应
    
    case 'FILL_FORM':
      handleFillForm(message.data, sendResponse);
      return true;
    
    case 'GET_PRODUCT':
      sendResponse({ success: true, data: getMockProduct() });
      break;
    
    case 'UPLOAD_PRODUCT':
      handleUploadProduct(message.data, sendResponse);
      return true;
  }
});

// 采集页面处理
async function handleCapturePage(sendResponse) {
  try {
    // 从content script获取页面数据
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      sendResponse({ success: false, error: '无法获取当前标签页' });
      return;
    }

    // 尝试从content script获取数据
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });
      sendResponse({ success: true, data: result });
    } catch (err) {
      // Content script未加载，返回模拟数据
      sendResponse({ success: true, data: getMockProduct() });
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 填表处理
async function handleFillForm(data, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FORM_DATA',
        data: data
      });
    }
    
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 上传商品处理
async function handleUploadProduct(data, sendResponse) {
  try {
    // 存储到Chrome Storage
    const products = await chrome.storage.local.get(['products']);
    const productList = products.products || [];
    
    const newProduct = {
      id: 'prd-' + Date.now(),
      ...data,
      status: 'raw',
      capturedAt: new Date().toISOString(),
    };
    
    productList.unshift(newProduct);
    await chrome.storage.local.set({ products: productList });
    
    sendResponse({ success: true, productId: newProduct.id });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 模拟商品数据
function getMockProduct() {
  return {
    title: '2024夏季新款可爱卡通小熊图案印花纯棉短袖T恤儿童百搭休闲上衣',
    price: 29.9,
    source: '1688',
    sourceUrl: 'https://detail.1688.com/offer/123456.html',
    thumb: 'https://placehold.co/200x200/pink/white?text=T-shirt',
    images: [
      'https://placehold.co/400x400/pink/white?text=主图',
      'https://placehold.co/400x400/blue/white?text=图2',
      'https://placehold.co/400x400/green/white?text=图3',
    ],
    skus: [
      { color: '白色', size: 'S', price: 29.9, stock: 50 },
      { color: '白色', size: 'M', price: 29.9, stock: 60 },
      { color: '蓝色', size: 'S', price: 29.9, stock: 45 },
    ],
    skuCount: 12,
    category: 'T恤',
    attributes: {
      '材质': '纯棉',
      '适用年龄': '3-12岁',
    },
  };
}

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] 插件已安装/更新:', details.reason);
  
  // 设置默认配置
  chrome.storage.local.set({
    config: {
      appUrl: 'http://localhost:5173',
      apiUrl: 'http://localhost:3004',
      targetLocale: 'vi-VN',
    }
  });
});

console.log('[Background] Service Worker 已启动');
