/** 卖家后台草稿页填入（原型：尝试常见输入框 + 提示） */
function toast(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '2147483647',
    top: '16px',
    right: '16px',
    maxWidth: '320px',
    padding: '12px 16px',
    background: '#073642',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(0,0,0,.2)',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function fillInput(selectors, value) {
  if (!value) return false;
  for (const sel of selectors) {
    const nodes = document.querySelectorAll(sel);
    for (const node of nodes) {
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        node.focus();
        node.value = value;
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
  }
  return false;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'FILL_DRAFT') return;
  const data = message.payload || {};
  const title = data.title || data.processed?.conversion?.title || '';
  const price = data.priceCny != null ? String(data.priceCny) : '';

  const titleOk = fillInput(
    [
      'input[name*="title" i]',
      'input[placeholder*="标题" i]',
      'input[placeholder*="title" i]',
      'textarea[name*="title" i]',
      '#title',
      '[data-testid*="title" i] input',
    ],
    title,
  );
  const priceOk = fillInput(
    ['input[name*="price" i]', 'input[placeholder*="价格" i]', 'input[type="number"]'],
    price,
  );

  toast(
    titleOk || priceOk
      ? `电商助手：已填入${titleOk ? '标题' : ''}${titleOk && priceOk ? '、' : ''}${priceOk ? '价格' : ''}，请在页面检查并发布。`
      : '电商助手：未找到可填写的表单项，请手动粘贴。',
  );
  sendResponse({ ok: titleOk || priceOk, titleOk, priceOk });
  return true;
});
