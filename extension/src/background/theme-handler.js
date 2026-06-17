/**
 * Background Script - 主题处理
 * 监听 Web 端主题变化并同步到插件
 */

// 注入共享主题管理器
importScripts('../shared/theme-manager.js');

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'THEME_UPDATED') {
    // Web 端主题更新，同步到插件存储
    const themeData = {
      presetId: message.presetId,
      colorOverrides: message.colorOverrides,
      timestamp: Date.now(),
    };
    
    ThemeManager.setThemeData(themeData).then(() => {
      // 通知所有 content scripts
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'THEME_SYNC',
            themeData,
          }).catch(() => {});
        });
      });
    });
    
    sendResponse({ success: true });
  }
  
  if (message.type === 'GET_THEME') {
    ThemeManager.getThemeData().then((data) => {
      sendResponse(data);
    });
    return true; // 异步响应
  }
});

console.log('[Background] Theme handler initialized');
