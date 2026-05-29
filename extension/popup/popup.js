const statusEl = document.getElementById('status');
const preview = document.getElementById('preview');
const previewTitle = document.getElementById('preview-title');
const previewMeta = document.getElementById('preview-meta');

chrome.storage.local.get(['extensionToken'], (data) => {
  if (data.extensionToken) {
    statusEl.textContent = '已绑定';
    statusEl.className = 'badge ok';
  }
});

document.getElementById('btn-capture').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const res = await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_PAGE' }).catch(() => null);
  if (!res?.ok) {
    previewTitle.textContent = '当前页暂不支持采集（原型仅 1688 详情）';
    previewMeta.textContent = tab.url ?? '';
    preview.classList.remove('hidden');
    return;
  }
  previewTitle.textContent = res.data.title || '(无标题)';
  previewMeta.textContent = `${res.data.source} · ¥${res.data.price?.amount ?? '-'}`;
  preview.classList.remove('hidden');
});

document.getElementById('btn-upload').addEventListener('click', () => {
  alert('原型：将调用 POST /api/v1/collect-jobs（需后端与 Token）');
});

document.getElementById('btn-link').addEventListener('click', () => {
  const url = prompt('粘贴商品链接');
  if (url) alert(`原型：解析链接\n${url}`);
});
