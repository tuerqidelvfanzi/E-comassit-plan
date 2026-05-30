/** 卖家后台草稿填入 · 淘宝选择器优先（shared/selectors/taobao-seller.json） */
(function () {
  const TAOBAO = globalThis.PSA_TAOBAO_SELLER_SELECTORS || {};

  function toast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed',
      zIndex: '2147483647',
      top: '16px',
      right: '16px',
      maxWidth: '360px',
      padding: '12px 16px',
      background: '#073642',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '13px',
      boxShadow: '0 4px 12px rgba(0,0,0,.2)',
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  }

  function isTaobaoSeller() {
    const h = location.hostname;
    return (
      h.includes('sell.taobao.com') ||
      h.includes('item.upload.taobao.com') ||
      h.includes('publish.taobao.com') ||
      h.includes('myseller.taobao.com')
    );
  }

  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function fillInput(selectors, value) {
    if (!value || !selectors?.length) return false;
    for (const sel of selectors) {
      try {
        const nodes = document.querySelectorAll(sel);
        for (const node of nodes) {
          if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
            if (node.offsetParent === null && node.type !== 'hidden') continue;
            node.focus();
            setNativeValue(node, value);
            return true;
          }
        }
      } catch {
        /* invalid selector */
      }
    }
    return false;
  }

  function selectorsFor(platform) {
    if (platform === 'taobao' || isTaobaoSeller()) {
      return {
        title: TAOBAO.title || [],
        price: TAOBAO.price || [],
        stock: TAOBAO.stock || [],
      };
    }
    if (platform === 'shopee') {
      return {
        title: ['input[name*="title" i]', 'textarea[name*="title" i]', '[data-testid*="title"] input'],
        price: ['input[name*="price" i]', 'input[placeholder*="价格" i]'],
      };
    }
    return {
      title: ['input[name*="title" i]', 'input[placeholder*="标题" i]', '#title'],
      price: ['input[name*="price" i]', 'input[type="number"]'],
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== 'FILL_DRAFT') return;
    const data = message.payload || {};
    const platform = data.platform || (isTaobaoSeller() ? 'taobao' : 'shopee');
    const title = data.title || data.processed?.conversion?.title || '';
    const price = data.priceCny != null ? String(data.priceCny) : '';
    const sel = selectorsFor(platform);

    const titleOk = fillInput(sel.title, title);
    const priceOk = fillInput(sel.price, price);
    const stockOk = data.stock ? fillInput(sel.stock, String(data.stock)) : false;

    const parts = [];
    if (titleOk) parts.push('标题');
    if (priceOk) parts.push('价格');
    if (stockOk) parts.push('库存');

    toast(
      parts.length
        ? `电商助手（${platform}）：已填入 ${parts.join('、')}，请在页面核对后发布。`
        : '电商助手：未匹配到淘宝卖家表单，请确认在「新建商品/草稿」页并刷新后重试。',
    );

    sendResponse({ ok: parts.length > 0, titleOk, priceOk, stockOk, platform });
    return true;
  });
})();
