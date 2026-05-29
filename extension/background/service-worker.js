chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'UPLOAD_PRODUCT') {
    // 原型：fetch('http://localhost:3004/api/v1/collect-jobs', ...)
    sendResponse({ ok: true, mock: true });
    return true;
  }
});
