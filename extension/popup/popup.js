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

chrome.storage.local.get(['appBaseUrl'], (data) => {
  const base = normalizeBase(data.appBaseUrl || DEFAULT_APP_BASE);
  appBaseInput.value = base;
  linkInbox.href = `${base}/app/inbox`;
});

appBaseInput.addEventListener('change', () => {
  const base = normalizeBase(appBaseInput.value.trim());
  chrome.storage.local.set({ appBaseUrl: base });
  linkInbox.href = `${base}/app/inbox`;
});

document.getElementById('btn-capture').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const res = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PAGE' }).catch(() => null);
  if (!res?.ok) {
    previewTitle.textContent = '当前页暂不支持自动采集';
    previewMeta.textContent = (tab.url ?? '') + '\n可改用「粘贴链接采集」或在 1688 详情页重试。';
    preview.classList.remove('hidden');
    lastCapture = null;
    return;
  }
  lastCapture = res.data;
  previewTitle.textContent = res.data.title || '(无标题)';
  previewMeta.textContent = `${res.data.source} · ¥${res.data.price?.amount ?? '-'}`;
  preview.classList.remove('hidden');
});

document.getElementById('btn-upload').addEventListener('click', async () => {
  if (!lastCapture) {
    alert('请先采集当前页');
    return;
  }
  const base = normalizeBase(appBaseInput.value.trim());
  await chrome.storage.local.set({ appBaseUrl: base });
  const payload = encodeURIComponent(JSON.stringify(lastCapture));
  const url = `${base}/app/inbox?demoImport=${payload}`;
  chrome.tabs.create({ url });
});

document.getElementById('btn-link').addEventListener('click', () => {
  const url = prompt('粘贴商品链接');
  if (!url) return;
  lastCapture = {
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
  const names = { shopee: 'Shopee', tiktok: 'TikTok Shop', taobao: '淘宝' };
  alert(
    `演示版：请在已打开的${names[platform] || ''}卖家后台「新建商品/草稿」页面使用。\n` +
      '正式版将自动填入标题、价格与图片。\n\n步骤 5：在目标网站点击「发布」完成上架。',
  );
});
