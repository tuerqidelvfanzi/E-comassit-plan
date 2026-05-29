function captureGeneric(source) {
  const title =
    document.querySelector('h1')?.textContent?.trim() ||
    document.querySelector('[class*="title"]')?.textContent?.trim() ||
    document.title;
  const priceText =
    document.querySelector('[class*="price"]')?.textContent?.replace(/[^\d.]/g, '') || '0';
  return {
    source,
    sourceUrl: location.href,
    title,
    price: { amount: parseFloat(priceText) || 0, currency: 'CNY' },
    images: [],
    capturedAt: new Date().toISOString(),
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_PAGE') {
    const host = location.hostname;
    const source = host.includes('taobao')
      ? '淘宝'
      : host.includes('tmall')
        ? '天猫'
        : host.includes('yangkeduo')
          ? '拼多多'
          : '源站';
    sendResponse({ ok: true, data: captureGeneric(source) });
  }
  return true;
});
