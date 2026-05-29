/** 注入 B 站页面，接收插件上传并写入 window.__PSA_API */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'PSA_COLLECT') return;
  const api = window.__PSA_API;
  if (!api?.collectJob) {
    sendResponse({ ok: false, reason: 'APP_API_NOT_READY' });
    return;
  }
  api
    .collectJob(message.payload)
    .then((res) => sendResponse({ ok: !!res?.ok, productId: res?.productId }))
    .catch(() => sendResponse({ ok: false }));
  return true;
});
