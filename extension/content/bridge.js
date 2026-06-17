chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'CAPTURE_PAGE') return;

  try {
    const data = globalThis.PsaExtractProduct.extractProduct();
    const adapter = globalThis.PsaExtractProduct.pickAdapter(location.hostname);
    sendResponse({
      ok: true,
      data,
      meta: {
        adapter: adapter?.id || 'generic',
        hostname: location.hostname,
      },
    });
  } catch (err) {
    sendResponse({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return true;
});
