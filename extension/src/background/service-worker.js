/**
 * 电商助手 Chrome Extension - Background Service Worker v3.1
 * 功能: 采集、填表、通信、API对接
 */

var CONFIG = {
  appUrl: 'http://localhost:5173',
  apiUrl: 'http://127.0.0.1:8080'
};

// 加载配置
chrome.storage.local.get(['config'], function(result) {
  if (result.config) {
    CONFIG = { ...CONFIG, ...result.config };
  }
});

// 消息处理
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('[Background] 收到消息:', message.type);

  switch (message.type) {
    case 'CAPTURE_PAGE':
      handleCapturePage(sendResponse);
      return true;

    case 'CAPTURE_RESULT':
      // 来自content的采集结果
      handleCaptureResult(message.data, message.platform, sendResponse);
      return true;

    case 'UPLOAD_TO_INBOX':
      handleUploadToInbox(message.data, sendResponse);
      return true;

    case 'FILL_FORM':
      handleFillForm(message.data, sendResponse);
      return true;

    case 'GET_PRODUCT':
      handleGetProduct(sendResponse);
      return true;

    case 'GET_CONFIG':
      sendResponse(CONFIG);
      return true;

    case 'SAVE_CONFIG':
      handleSaveConfig(message.config, sendResponse);
      return true;
  }
});

async function handleCapturePage(sendResponse) {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) {
      sendResponse({ success: false, error: '无法获取当前标签页' });
      return;
    }
    try {
      var result = await chrome.tabs.sendMessage(tabs[0].id, { type: 'CAPTURE_PAGE' });
      sendResponse(result);
    } catch (err) {
      sendResponse({ success: false, error: '请在商品详情页使用插件' });
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleCaptureResult(data, platform, sendResponse) {
  console.log('[Background] 采集结果:', platform, data.title);
  // 可以在这里添加自动上传等逻辑
  sendResponse({ success: true });
}

async function handleUploadToInbox(data, sendResponse) {
  try {
    var storage = await chrome.storage.local.get(['ecomassist_ext_token']);
    var token = storage['ecomassist_ext_token'] || '';

    var res = await fetch(CONFIG.apiUrl + '/api/v1/collect-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Token': token
      },
      body: JSON.stringify({ payload: data })
    });

    if (res.ok) {
      var json = await res.json();
      sendResponse({ success: true, data: json.data });
    } else {
      sendResponse({ success: false, error: '上传失败: ' + res.status });
    }
  } catch (err) {
    // 离线模式，存储到本地
    var products = await chrome.storage.local.get(['products']);
    var list = products.products || [];
    list.unshift({
      id: 'prd-' + Date.now(),
      ...data,
      status: 'raw',
      capturedAt: new Date().toISOString()
    });
    await chrome.storage.local.set({ products: list });
    sendResponse({ success: true, offline: true });
  }
}

async function handleFillForm(data, sendResponse) {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'FILL_FORM_DATA',
        data: data
      });
    }
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleGetProduct(sendResponse) {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      var result = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_DATA' });
      sendResponse({ success: true, data: result });
    } else {
      sendResponse({ success: false, error: '无活动标签页' });
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

function handleSaveConfig(config, sendResponse) {
  CONFIG = { ...CONFIG, ...config };
  chrome.storage.local.set({ config: CONFIG });
  sendResponse({ success: true });
}

// 监听安装事件
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('[Background] 插件已安装/更新:', details.reason);
  chrome.storage.local.set({
    config: {
      appUrl: 'http://localhost:5173',
      apiUrl: 'http://127.0.0.1:8080',
      targetLocale: 'vi-VN'
    }
  });
});

console.log('[Background] Service Worker v3.1 已启动');
