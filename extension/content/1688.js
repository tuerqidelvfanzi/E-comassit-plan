function capture1688() {
  const title =
    document.querySelector('h1')?.textContent?.trim() ||
    document.querySelector('[class*="title"]')?.textContent?.trim() ||
    document.title;
  const priceText =
    document.querySelector('[class*="price"]')?.textContent?.replace(/[^\d.]/g, '') || '0';
  return {
    source: '1688',
    sourceUrl: location.href,
    title,
    price: { amount: parseFloat(priceText) || 0, currency: 'CNY' },
    images: [],
    capturedAt: new Date().toISOString(),
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CAPTURE_PAGE') {
    sendResponse({ ok: true, data: capture1688() });
  }
  return true;
});
