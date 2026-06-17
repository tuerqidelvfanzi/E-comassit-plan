const DEFAULT_APP_BASE = 'https://tuerqidelvfanzi.github.io/E-comassit-plan';
const DEFAULT_API_BASE = 'http://127.0.0.1:8080';

function normalizeBase(url) {
  return (url || DEFAULT_APP_BASE).replace(/\/+$/, '');
}

async function uploadCollect(payload, appBase) {
  const base = normalizeBase(appBase);
  const stored = await chrome.storage.local.get(['apiBaseUrl', 'extensionToken']);
  const apiBase = (stored.apiBaseUrl || DEFAULT_API_BASE).replace(/\/+$/, '');
  const extToken = stored.extensionToken;

  if (extToken) {
    try {
      const res = await fetch(`${apiBase}/api/v1/collect-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Token': extToken,
        },
        body: JSON.stringify({ payload }),
      });
      const json = await res.json();
      if (res.ok && json.code === 0) {
        return { ok: true, viaApi: true, productId: json.data?.product?.id };
      }
    } catch {
      /* fallback */
    }
  }

  const patterns = [`${base}/*`, `${base.replace('https://', 'http://')}/*`];
  if (base.includes('localhost')) {
    patterns.push('http://localhost:3004/*', 'http://127.0.0.1:3004/*');
  }

  for (const pattern of patterns) {
    const tabs = await chrome.tabs.query({ url: pattern });
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        const res = await chrome.tabs.sendMessage(tab.id, {
          type: 'PSA_COLLECT',
          payload,
        });
        if (res?.ok) {
          await chrome.tabs.update(tab.id, { active: true });
          return { ok: true, viaBridge: true, productId: res.productId };
        }
      } catch {
        /* continue */
      }
    }
  }

  const encoded = encodeURIComponent(JSON.stringify(payload));
  await chrome.tabs.create({ url: `${base}/app/inbox?demoImport=${encoded}` });
  return { ok: true, viaBridge: false };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'UPLOAD_COLLECT') {
    uploadCollect(message.payload, message.appBase)
      .then(sendResponse)
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  return false;
});
