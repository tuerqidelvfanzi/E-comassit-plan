/**
 * 卖家后台草稿填入（DOM 尝试 + Mock 预览面板）
 * 演示版：平台 DOM 变更频繁时，以浮动面板展示完整填表载荷，便于对照实现。
 */
(function () {
  const TAOBAO = globalThis.PSA_TAOBAO_SELLER_SELECTORS || {};
  const SHOPEE = globalThis.PSA_SHOPEE_SELLER_SELECTORS || {};
  const TIKTOK = globalThis.PSA_TIKTOK_SELLER_SELECTORS || {};

  const PANEL_ID = 'psa-publish-fill-panel';
  const FAB_ID = 'psa-publish-fill-fab';

  function detectPlatform() {
    const h = location.hostname;
    if (
      h.includes('sell.taobao.com') ||
      h.includes('item.upload.taobao.com') ||
      h.includes('publish.taobao.com') ||
      h.includes('myseller.taobao.com')
    ) {
      return 'taobao';
    }
    if (h.includes('shopee') && (h.includes('seller') || h.includes('sell'))) return 'shopee';
    if (h.includes('tiktok') && h.includes('seller')) return 'tiktok';
    return 'unknown';
  }

  function toast(msg, tone) {
    const el = document.createElement('div');
    el.textContent = msg;
    const bg = tone === 'warn' ? '#b45309' : tone === 'ok' ? '#059669' : '#1e40af';
    Object.assign(el.style, {
      position: 'fixed',
      zIndex: '2147483646',
      top: '16px',
      right: '16px',
      maxWidth: '380px',
      padding: '12px 16px',
      background: bg,
      color: '#fff',
      borderRadius: '10px',
      fontSize: '13px',
      lineHeight: '1.45',
      boxShadow: '0 8px 24px rgba(0,0,0,.18)',
      fontFamily: 'system-ui, "Segoe UI", "PingFang SC", sans-serif',
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 7000);
  }

  function setNativeValue(el, value) {
    const proto =
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function fillInput(selectors, value) {
    if (value == null || value === '' || !selectors?.length) return false;
    const text = String(value);
    for (const sel of selectors) {
      try {
        const nodes = document.querySelectorAll(sel);
        for (const node of nodes) {
          if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
            if (node.offsetParent === null && node.type !== 'hidden') continue;
            node.focus();
            setNativeValue(node, text);
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
    const p = platform === 'unknown' ? detectPlatform() : platform;
    if (p === 'taobao') {
      return {
        platform: 'taobao',
        title: TAOBAO.title || [],
        price: TAOBAO.price || [],
        stock: TAOBAO.stock || [],
        shortDescription: [],
        brand: [],
      };
    }
    if (p === 'shopee') {
      return {
        platform: 'shopee',
        title: SHOPEE.title || [],
        price: SHOPEE.price || [],
        stock: SHOPEE.stock || [],
        shortDescription: SHOPEE.shortDescription || [],
        brand: [],
      };
    }
    if (p === 'tiktok') {
      return {
        platform: 'tiktok',
        title: TIKTOK.title || [],
        price: TIKTOK.price || [],
        stock: TIKTOK.stock || [],
        shortDescription: [],
        brand: TIKTOK.brand || [],
      };
    }
    return { platform: p, title: [], price: [], stock: [], shortDescription: [], brand: [] };
  }

  function normalizePayload(raw) {
    const platform =
      raw.platform ||
      (raw.fillPayload && raw.fillPayload.platform) ||
      detectPlatform();
    const data = raw.fillPayload || raw;
    return {
      platform,
      taskId: raw.taskId,
      title: data.title || '',
      price: data.price != null ? data.price : data.priceCny,
      currency: data.currency || 'CNY',
      stock: data.stock,
      weightGrams: data.weightGrams,
      brand: data.brand || 'No Brand',
      shortDescription: data.shortDescription || data.short_description || '',
      description: data.description || '',
      skus: Array.isArray(data.skus) ? data.skus : [],
      logistics: data.logistics || {},
      imageUrls: data.imageUrls || data.images || [],
      _source: raw._source || 'api',
    };
  }

  function runDomFill(payload) {
    const sel = selectorsFor(payload.platform);
    const titleOk = fillInput(sel.title, payload.title);
    const priceOk =
      payload.price != null ? fillInput(sel.price, String(payload.price)) : false;
    const stockOk =
      payload.stock != null ? fillInput(sel.stock, String(payload.stock)) : false;
    const shortOk = payload.shortDescription
      ? fillInput(sel.shortDescription, payload.shortDescription)
      : false;
    const brandOk = payload.brand ? fillInput(sel.brand, payload.brand) : false;

    return {
      platform: sel.platform,
      titleOk,
      priceOk,
      stockOk,
      shortOk,
      brandOk,
      any: titleOk || priceOk || stockOk || shortOk || brandOk,
    };
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMockPanel(payload, domResult) {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      document.body.appendChild(panel);
    }

    const dims = payload.logistics?.packageDimensions;
    const dimStr = dims ? `${dims.length}×${dims.width}×${dims.height} cm` : '10×5×10 cm';
    const skuRows = (payload.skus || [])
      .map(
        (s) =>
          `<tr><td><code>${esc(s.skuCode)}</code></td><td>${esc(s.color)}</td><td>${esc(s.size)}</td><td>${esc(s.price)}</td><td>${esc(s.stock)}</td></tr>`,
      )
      .join('');

    const domLines = [
      domResult.titleOk ? '✓ 标题' : '— 标题',
      domResult.priceOk ? '✓ 价格' : '— 价格',
      domResult.stockOk ? '✓ 库存' : '— 库存',
      domResult.shortOk ? '✓ 短描述' : '— 短描述',
      domResult.brandOk ? '✓ 品牌' : '— 品牌',
    ].join(' · ');

    panel.innerHTML = `
<style>
  #${PANEL_ID} {
    position: fixed; z-index: 2147483647; top: 12px; left: 12px;
    width: min(420px, calc(100vw - 24px)); max-height: calc(100vh - 24px);
    overflow: auto; background: #fff; border-radius: 14px;
    box-shadow: 0 12px 40px rgba(15,23,42,.22);
    font-family: system-ui, "Segoe UI", "PingFang SC", sans-serif;
    font-size: 13px; color: #0f172a; border: 1px solid #e2e8f0;
  }
  #${PANEL_ID} .psa-hd {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; background: linear-gradient(135deg, #1e40af, #2563eb);
    color: #fff; border-radius: 14px 14px 0 0;
  }
  #${PANEL_ID} .psa-hd strong { font-size: 14px; }
  #${PANEL_ID} .psa-badge {
    font-size: 10px; padding: 2px 8px; border-radius: 999px;
    background: rgba(255,255,255,.2); margin-left: 6px;
  }
  #${PANEL_ID} .psa-body { padding: 12px 14px 14px; }
  #${PANEL_ID} .psa-row { margin-bottom: 10px; }
  #${PANEL_ID} .psa-label { font-size: 11px; color: #64748b; margin-bottom: 2px; }
  #${PANEL_ID} .psa-val { font-size: 13px; word-break: break-word; }
  #${PANEL_ID} table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
  #${PANEL_ID} th, #${PANEL_ID} td { border: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; }
  #${PANEL_ID} th { background: #f8fafc; }
  #${PANEL_ID} .psa-dom { font-size: 11px; padding: 8px; background: #f0fdf4; border-radius: 8px; color: #166534; margin-bottom: 10px; }
  #${PANEL_ID} .psa-dom.warn { background: #fffbeb; color: #92400e; }
  #${PANEL_ID} .psa-foot { font-size: 11px; color: #64748b; margin-top: 10px; line-height: 1.5; }
  #${PANEL_ID} button.psa-close {
    border: none; background: rgba(255,255,255,.25); color: #fff;
    width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 16px;
  }
  #${PANEL_ID} button.psa-copy {
    width: 100%; margin-top: 8px; padding: 8px; border: none; border-radius: 8px;
    background: #2563eb; color: #fff; cursor: pointer; font-size: 12px;
  }
</style>
<div class="psa-hd">
  <div><strong>电商助手 · 填表预览</strong><span class="psa-badge">UI MOCK</span></div>
  <button type="button" class="psa-close" title="关闭">×</button>
</div>
<div class="psa-body">
  <div class="psa-dom ${domResult.any ? '' : 'warn'}">
    DOM 填入：${esc(domLines)}<br/>
    平台：${esc(payload.platform)} · 任务：${esc(payload.taskId || '演示')}
  </div>
  <div class="psa-row"><div class="psa-label">标题</div><div class="psa-val">${esc(payload.title)}</div></div>
  <div class="psa-row"><div class="psa-label">价格 / 库存 / 重量</div>
    <div class="psa-val">${esc(payload.price)} ${esc(payload.currency)} · 库存 ${esc(payload.stock ?? '—')} · ${esc(payload.weightGrams ?? 220)}g</div></div>
  <div class="psa-row"><div class="psa-label">品牌 · 包裹</div>
    <div class="psa-val">${esc(payload.brand)} · ${esc(dimStr)}</div></div>
  ${
    payload.shortDescription
      ? `<div class="psa-row"><div class="psa-label">短描述</div><div class="psa-val">${esc(payload.shortDescription)}</div></div>`
      : ''
  }
  ${
    skuRows
      ? `<div class="psa-row"><div class="psa-label">SKU 变体 (${payload.skus.length})</div>
         <table><thead><tr><th>编码</th><th>颜色</th><th>尺码</th><th>价</th><th>库存</th></tr></thead><tbody>${skuRows}</tbody></table></div>`
      : ''
  }
  <button type="button" class="psa-copy">复制 JSON 载荷</button>
  <p class="psa-foot">正式版将按此面板字段自动填入平台表单。当前 DOM 选择器为最佳努力匹配，请在「新建商品/草稿」页使用。</p>
</div>`;

    panel.querySelector('.psa-close')?.addEventListener('click', () => panel.remove());
    panel.querySelector('.psa-copy')?.addEventListener('click', () => {
      void navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast('已复制填表 JSON', 'ok');
    });
  }

  function ensureFab() {
    if (document.getElementById(FAB_ID)) return;
    const fab = document.createElement('button');
    fab.id = FAB_ID;
    fab.type = 'button';
    fab.textContent = '电商助手';
    Object.assign(fab.style, {
      position: 'fixed',
      zIndex: '2147483645',
      bottom: '20px',
      right: '20px',
      padding: '10px 14px',
      border: 'none',
      borderRadius: '999px',
      background: '#2563eb',
      color: '#fff',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(37,99,235,.45)',
      fontFamily: 'system-ui, sans-serif',
    });
    fab.addEventListener('click', () => {
      chrome.storage.local.get(['lastFillPayload'], (data) => {
        const payload = data.lastFillPayload || demoPayload();
        const domResult = runDomFill(payload);
        renderMockPanel(payload, domResult);
      });
    });
    document.body.appendChild(fab);
  }

  function demoPayload() {
    const platform = detectPlatform() === 'unknown' ? 'shopee' : detectPlatform();
    return normalizePayload({
      platform,
      _source: 'demo',
      title: '（演示）đầm bé gái cotton mùa hè',
      price: platform === 'tiktok' ? 199 : 500,
      currency: platform === 'tiktok' ? 'THB' : 'PHP',
      stock: platform === 'tiktok' ? 50 : 800,
      weightGrams: 220,
      brand: 'No Brand',
      shortDescription: '演示短描述 ≤20字',
      skus: [
        {
          skuCode: 'BF-0001-PR-WH-M',
          color: '白色',
          size: 'M',
          price: 500,
          stock: 50,
        },
        {
          skuCode: 'BF-9999-P-WH-M',
          color: 'Hook',
          size: 'M',
          price: 400,
          stock: 5,
          isDummyHook: true,
        },
      ],
      logistics: { packageDimensions: { length: 10, width: 5, height: 10 } },
    });
  }

  function handleFillDraft(raw) {
    const payload = normalizePayload(raw);
    const domResult = runDomFill(payload);
    chrome.storage.local.set({ lastFillPayload: payload });
    renderMockPanel(payload, domResult);

    const parts = [];
    if (domResult.titleOk) parts.push('标题');
    if (domResult.priceOk) parts.push('价格');
    if (domResult.stockOk) parts.push('库存');
    if (domResult.shortOk) parts.push('短描述');
    if (domResult.brandOk) parts.push('品牌');

    if (parts.length) {
      toast(`已尝试填入：${parts.join('、')}。请核对左侧预览面板。`, 'ok');
    } else {
      toast('未匹配到表单字段，已打开 Mock 填表预览面板（左侧）。', 'warn');
    }

    return { ok: true, ...domResult, mockPanel: true };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'FILL_DRAFT') {
      sendResponse(handleFillDraft(message.payload || {}));
      return true;
    }
    if (message.type === 'SHOW_FILL_MOCK') {
      sendResponse(handleFillDraft(message.payload || demoPayload()));
      return true;
    }
    if (message.type === 'PSA_DETECT_PLATFORM') {
      sendResponse({ platform: detectPlatform() });
      return true;
    }
    return false;
  });

  if (detectPlatform() !== 'unknown') {
    ensureFab();
  }
})();
