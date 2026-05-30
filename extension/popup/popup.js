const DEFAULT_APP_BASE = 'https://tuerqidelvfanzi.github.io/E-comassit-plan';
const DEFAULT_API_BASE = 'http://127.0.0.1:8080';

const appBaseInput = document.getElementById('app-base');
const apiBaseInput = document.getElementById('api-base');
const extTokenInput = document.getElementById('ext-token');
const connStatus = document.getElementById('conn-status');
const preview = document.getElementById('preview');
const previewTitle = document.getElementById('preview-title');
const previewMeta = document.getElementById('preview-meta');
const linkInbox = document.getElementById('link-inbox');
const linkPublish = document.getElementById('link-publish');
const fillPreview = document.getElementById('fill-preview');
const fillDl = document.getElementById('fill-dl');

let lastCapture = null;
let lastFillPayload = null;

function normalizeBase(url) {
  return (url || DEFAULT_APP_BASE).replace(/\/+$/, '');
}

function getConfig() {
  return {
    appBase: normalizeBase(appBaseInput.value.trim()),
    apiBase: (apiBaseInput?.value?.trim() || DEFAULT_API_BASE).replace(/\/+$/, ''),
    extToken: extTokenInput?.value?.trim() || '',
  };
}

function persistConfig() {
  const cfg = getConfig();
  chrome.storage.local.set({
    appBaseUrl: cfg.appBase,
    apiBaseUrl: cfg.apiBase,
    extensionToken: cfg.extToken,
  });
  linkInbox.href = `${cfg.appBase}/app/inbox`;
  linkPublish.href = `${cfg.appBase}/app/publish`;
}

// Tabs
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.hidden = true;
      p.classList.remove('active');
    });
    tab.classList.add('active');
    const id = `panel-${tab.dataset.tab}`;
    const panel = document.getElementById(id);
    panel.hidden = false;
    panel.classList.add('active');
  });
});

chrome.storage.local.get(['appBaseUrl', 'apiBaseUrl', 'extensionToken', 'lastFillPayload'], (data) => {
  appBaseInput.value = normalizeBase(data.appBaseUrl || DEFAULT_APP_BASE);
  if (apiBaseInput) apiBaseInput.value = data.apiBaseUrl || DEFAULT_API_BASE;
  if (extTokenInput && data.extensionToken) extTokenInput.value = data.extensionToken;
  if (data.lastFillPayload) {
    lastFillPayload = data.lastFillPayload;
    renderFillPreview(lastFillPayload);
  }
  persistConfig();
  if (data.extensionToken) void testApiConnection(false);
});

appBaseInput.addEventListener('change', persistConfig);
apiBaseInput?.addEventListener('change', persistConfig);
extTokenInput?.addEventListener('change', persistConfig);

async function testApiConnection(showAlert) {
  const { apiBase, extToken } = getConfig();
  const msgEl = document.getElementById('api-test-msg');
  if (!extToken) {
    connStatus.textContent = '未配置令牌';
    connStatus.className = 'status-pill warn';
    if (msgEl) msgEl.textContent = '请在 B 站设置页复制插件令牌。';
    return false;
  }
  try {
    const res = await fetch(`${apiBase}/api/v1/extension/publish-fill?platform=shopee`, {
      headers: { 'X-Extension-Token': extToken },
    });
    const json = await res.json();
    if (json.code === 0) {
      connStatus.textContent = 'API 已连接';
      connStatus.className = 'status-pill ok';
      if (msgEl) {
        msgEl.className = 'msg ok';
        msgEl.textContent = '连接成功。可在「发布」页拉取填表数据。';
      }
      return true;
    }
    if (json.code !== 0 && res.status === 404) {
      connStatus.textContent = 'API 通（无任务）';
      connStatus.className = 'status-pill ok';
      if (msgEl) {
        msgEl.className = 'msg ok';
        msgEl.textContent = 'API 可用。请先在发布中心「生成填表」。';
      }
      return true;
    }
    connStatus.textContent = '连接失败';
    connStatus.className = 'status-pill warn';
    if (msgEl) {
      msgEl.className = 'msg err';
      msgEl.textContent = json.message || `HTTP ${res.status}`;
    }
    if (showAlert) alert(msgEl?.textContent || '连接失败');
    return false;
  } catch {
    connStatus.textContent = 'API 不可达';
    connStatus.className = 'status-pill warn';
    if (msgEl) {
      msgEl.className = 'msg err';
      msgEl.textContent = `无法连接 ${apiBase}，请确认 api 已启动。`;
    }
    if (showAlert) alert(msgEl.textContent);
    return false;
  }
}

document.getElementById('btn-test-api')?.addEventListener('click', () => {
  persistConfig();
  void testApiConnection(true);
});

function renderFillPreview(payload) {
  if (!payload || !fillDl) return;
  fillPreview?.classList.remove('hidden');
  const rows = [
    ['平台', payload.platform],
    ['标题', payload.title],
    ['价格', `${payload.price} ${payload.currency || ''}`],
    ['库存', payload.stock],
    ['重量', payload.weightGrams ? `${payload.weightGrams}g` : '—'],
    ['品牌', payload.brand],
    ['SKU 数', payload.skus?.length ?? 0],
  ];
  fillDl.innerHTML = rows
    .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(String(v ?? '—'))}</dd>`)
    .join('');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.getElementById('btn-load-fill')?.addEventListener('click', async () => {
  persistConfig();
  const { apiBase, extToken } = getConfig();
  const platform = document.getElementById('platform').value;
  if (!extToken) {
    alert('请先配置插件令牌');
    return;
  }
  try {
    const res = await fetch(`${apiBase}/api/v1/extension/publish-fill?platform=${platform}`, {
      headers: { 'X-Extension-Token': extToken },
    });
    const json = await res.json();
    if (json.code === 0 && json.data?.fillPayload) {
      lastFillPayload = { ...json.data.fillPayload, platform, taskId: json.data.taskId };
      chrome.storage.local.set({ lastFillPayload });
      renderFillPreview(lastFillPayload);
      alert('已加载填表数据');
      return;
    }
    alert(json.message === 'NO_PREPARED_TASK' ? '请先在 B 站发布中心点击「生成填表」' : json.message || '加载失败');
  } catch {
    alert('无法连接 API');
  }
});

document.getElementById('btn-capture').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const res = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PAGE' }).catch(() => null);
  if (!res?.ok) {
    previewTitle.textContent = '当前页暂不支持自动采集';
    previewMeta.textContent = `${tab.url ?? ''}\n请在 1688/淘宝/天猫详情页重试。`;
    preview.classList.remove('hidden');
    lastCapture = null;
    return;
  }
  lastCapture = res.data;
  previewTitle.textContent = res.data.title || '(无标题)';
  const layer = res.data.extractLayer ? ` · ${res.data.extractLayer}` : '';
  const imgN = res.data.images?.length ? ` · ${res.data.images.length} 图` : '';
  previewMeta.textContent = `${res.data.source} · ¥${res.data.price?.amount ?? '-'}${layer}${imgN}`;
  preview.classList.remove('hidden');
});

document.getElementById('btn-upload').addEventListener('click', async () => {
  if (!lastCapture) {
    alert('请先采集当前页');
    return;
  }
  persistConfig();
  await chrome.storage.local.set({ lastCapture });
  chrome.runtime.sendMessage(
    { type: 'UPLOAD_COLLECT', payload: lastCapture, appBase: getConfig().appBase },
    (res) => {
      if (!res?.ok) {
        alert('上传失败，请检查 API 与令牌');
        return;
      }
      alert(res.viaApi ? '已通过 API 写入采集箱' : res.viaBridge ? '已写入采集箱' : '已打开采集箱导入');
    },
  );
});

document.getElementById('btn-link').addEventListener('click', () => {
  const url = prompt('粘贴商品链接');
  if (!url) return;
  lastCapture = {
    schemaVersion: '1.0.0',
    source: '链接采集',
    sourceUrl: url,
    title: `链接商品 ${url.slice(0, 40)}…`,
    price: { amount: 0, currency: 'CNY' },
    capturedAt: new Date().toISOString(),
  };
  previewTitle.textContent = lastCapture.title;
  previewMeta.textContent = url;
  preview.classList.remove('hidden');
});

document.getElementById('btn-sync-cookies').addEventListener('click', async () => {
  const statusEl = document.getElementById('cookie-status');
  const { apiBase, extToken } = getConfig();
  if (!extToken) {
    statusEl.textContent = '请先配置插件令牌';
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = tab?.url ? new URL(tab.url).hostname : '';
  let domain = 'taobao.com';
  if (host.includes('1688')) domain = '1688.com';
  else if (host.includes('tmall')) domain = 'tmall.com';
  else if (!host.includes('taobao')) {
    statusEl.textContent = '请在已登录的淘宝/1688 页面操作';
    return;
  }
  statusEl.textContent = '正在同步…';
  const cookies = await chrome.cookies.getAll({ domain });
  try {
    const res = await fetch(`${apiBase}/api/v1/extension/cookies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Extension-Token': extToken },
      body: JSON.stringify({
        domain,
        consent: true,
        cookies: cookies.map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          sameSite: c.sameSite,
          expirationDate: c.expirationDate,
        })),
      }),
    });
    const json = await res.json();
    statusEl.className = json.code === 0 ? 'msg ok' : 'msg err';
    statusEl.textContent =
      json.code === 0 ? `已同步 ${json.data.count} 条 Cookie` : `失败：${json.message || res.status}`;
  } catch {
    statusEl.className = 'msg err';
    statusEl.textContent = `无法连接 API：${apiBase}`;
  }
});

async function sendFillToTab(payload) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    alert('无活动标签页');
    return;
  }
  const res = await chrome.tabs
    .sendMessage(tab.id, { type: 'FILL_DRAFT', payload })
    .catch(() => null);
  if (!res) {
    const names = { shopee: 'Shopee', tiktok: 'TikTok', taobao: '淘宝' };
    alert(
      `请在${names[payload.platform] || ''}卖家后台「新建商品/草稿」页操作，并刷新页面后重试。\n` +
        '演示版会在页面左侧显示 Mock 填表预览面板。',
    );
    return;
  }
  if (res.mockPanel) {
    alert('已打开左侧填表预览面板，请对照字段在平台表单中核对。');
  }
}

document.getElementById('btn-publish').addEventListener('click', async () => {
  persistConfig();
  const platform = document.getElementById('platform').value;
  const { apiBase, extToken } = getConfig();

  let fillPayload = lastFillPayload?.platform === platform ? lastFillPayload : null;

  if (!fillPayload && extToken) {
    try {
      const res = await fetch(`${apiBase}/api/v1/extension/publish-fill?platform=${platform}`, {
        headers: { 'X-Extension-Token': extToken },
      });
      const json = await res.json();
      if (json.code === 0 && json.data?.fillPayload) {
        fillPayload = { ...json.data.fillPayload, platform, taskId: json.data.taskId };
        lastFillPayload = fillPayload;
        chrome.storage.local.set({ lastFillPayload });
        renderFillPreview(fillPayload);
      }
    } catch {
      /* fallback */
    }
  }

  if (!fillPayload) {
    const stored = await chrome.storage.local.get(['lastCapture']);
    const cap = lastCapture || stored.lastCapture;
    if (!cap) {
      alert('请先在发布中心生成填表，或点击「从 API 拉取填表数据」。');
      return;
    }
    fillPayload = {
      platform,
      title: cap.title,
      price: cap.price?.amount ?? 0,
      currency: 'CNY',
      stock: 50,
      brand: 'No Brand',
      _source: 'capture-fallback',
    };
  }

  await sendFillToTab(fillPayload);
});

document.getElementById('btn-mock-only')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const platform = document.getElementById('platform').value;
  await chrome.tabs.sendMessage(tab.id, {
    type: 'SHOW_FILL_MOCK',
    payload: lastFillPayload || { platform },
  });
});
