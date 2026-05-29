const DEFAULT_APP_BASE = 'https://tuerqidelvfanzi.github.io/E-comassit-plan';

const appBaseInput = document.getElementById('app-base');
const preview = document.getElementById('preview');
const previewTitle = document.getElementById('preview-title');
const previewMeta = document.getElementById('preview-meta');
const linkInbox = document.getElementById('link-inbox');

let lastCapture = null;

function normalizeBase(url) {
  return (url || DEFAULT_APP_BASE).replace(/\/+$/, '');
}

const apiBaseInput = document.getElementById('api-base');
const extTokenInput = document.getElementById('ext-token');

chrome.storage.local.get(['appBaseUrl', 'apiBaseUrl', 'extensionToken'], (data) => {
  const base = normalizeBase(data.appBaseUrl || DEFAULT_APP_BASE);
  appBaseInput.value = base;
  linkInbox.href = `${base}/app/inbox`;
  if (apiBaseInput) apiBaseInput.value = data.apiBaseUrl || 'http://127.0.0.1:8080';
  if (extTokenInput && data.extensionToken) extTokenInput.value = data.extensionToken;
});

function persistPluginConfig() {
  chrome.storage.local.set({
    appBaseUrl: normalizeBase(appBaseInput.value.trim()),
    apiBaseUrl: apiBaseInput?.value?.trim() || 'http://127.0.0.1:8080',
    extensionToken: extTokenInput?.value?.trim() || '',
  });
}

apiBaseInput?.addEventListener('change', persistPluginConfig);
extTokenInput?.addEventListener('change', persistPluginConfig);

appBaseInput.addEventListener('change', () => {
  const base = normalizeBase(appBaseInput.value.trim());
  linkInbox.href = `${base}/app/inbox`;
  persistPluginConfig();
});

document.getElementById('btn-capture').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const res = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PAGE' }).catch(() => null);
  if (!res?.ok) {
    previewTitle.textContent = '当前页暂不支持自动采集';
    previewMeta.textContent =
      (tab.url ?? '') + '\n请在 1688 / 淘宝 / 天猫 商品详情页重试，或使用「粘贴链接采集」。';
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
  const base = normalizeBase(appBaseInput.value.trim());
  persistPluginConfig();
  await chrome.storage.local.set({ lastCapture });
  chrome.runtime.sendMessage(
    { type: 'UPLOAD_COLLECT', payload: lastCapture, appBase: base },
    (res) => {
      if (!res?.ok) {
        alert('上传失败，请检查 B 站地址是否已登录并打开');
        return;
      }
      if (res.viaBridge) {
        alert('已写入采集箱（当前已打开的 B 站标签页）');
      } else {
        alert('已打开采集箱页面完成导入');
      }
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

document.getElementById('btn-publish').addEventListener('click', async () => {
  const platform = document.getElementById('platform').value;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const stored = await chrome.storage.local.get(['lastCapture']);
  const payload = lastCapture || stored.lastCapture;
  if (!payload) {
    alert('请先在商品页采集，或从采集箱选择可发布商品后再填入。');
    return;
  }

  const fillPayload = {
    title: payload.title,
    priceCny: payload.price?.amount ?? 0,
    platform,
  };

  const res = await chrome.tabs.sendMessage(tab.id, { type: 'FILL_DRAFT', payload: fillPayload }).catch(() => null);
  if (!res) {
    const names = { shopee: 'Shopee', tiktok: 'TikTok Shop', taobao: '淘宝' };
    alert(
      `请在已打开的${names[platform] || ''}卖家后台「新建商品/草稿」页面重试。\n` +
        '若页面无反应，请刷新卖家后台后再点「填入草稿」。',
    );
  }
});
