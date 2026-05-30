/** 详情页提取脚本（在 page.evaluate 内序列化执行） */
export const EXTRACT_DETAIL_SCRIPT = `
(() => {
  const ITEM_RE = /item\\.taobao\\.com|detail\\.tmall\\.com|detail\\.1688\\.com/;
  if (!ITEM_RE.test(location.href)) return null;

  function parsePrice(v) {
    if (v == null) return 0;
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function deepFind(obj, pred, depth = 0) {
    if (!obj || depth > 8) return null;
    if (pred(obj)) return obj;
    if (typeof obj !== 'object') return null;
    for (const v of Object.values(obj)) {
      const f = deepFind(v, pred, depth + 1);
      if (f) return f;
    }
    return null;
  }

  function fromGlobals() {
    const keys = ['__INITIAL_STATE__', '__INIT_DATA__', 'g_config', 'pageData', '__ICE_APP_CONTEXT__'];
    for (const k of keys) {
      const g = window[k];
      const item = deepFind(g, (o) => o && (o.title || o.itemTitle) && (o.price != null || o.priceText));
      if (item) {
        const title = item.title || item.itemTitle || item.name;
        const price = item.price ?? item.priceText ?? item.qianggouPrice ?? item.promoPrice;
        const imgs = [];
        const pics = item.images || item.itemImgs || item.picUrlList;
        if (typeof item.pic === 'string') imgs.push(item.pic);
        if (Array.isArray(pics)) pics.forEach((p) => imgs.push(typeof p === 'string' ? p : p?.url));
        return { title: String(title), price: parsePrice(price), images: imgs.filter(Boolean).slice(0, 12) };
      }
    }
    return null;
  }

  function fromDom() {
    const title =
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('[class*="title"]')?.textContent?.trim() ||
      document.title;
    const priceEl = document.querySelector('[class*="price"], .tm-price, .price');
    const price = parsePrice(priceEl?.textContent);
    const images = [...document.querySelectorAll('img[src*="alicdn"], img[src*="tbcdn"]')]
      .map((i) => i.src)
      .filter((s) => s && !s.includes('avatar'))
      .slice(0, 12);
    return { title, price, images };
  }

  const g = fromGlobals();
  const d = fromDom();
  const title = g?.title || d?.title;
  if (!title) return null;

  const host = location.hostname;
  let source = '淘宝';
  if (host.includes('1688')) source = '1688';
  else if (host.includes('tmall')) source = '天猫';

  return {
    source,
    sourceUrl: location.href.split('#')[0],
    title,
    price: { amount: g?.price || d?.price || 0, currency: 'CNY' },
    images: g?.images?.length ? g.images : d.images,
    skus: [],
    attributes: {},
    capturedAt: new Date().toISOString(),
    extractLayer: g ? 'L1' : 'L4',
    extractMethod: g ? 'json_embed' : 'dom',
  };
})()
`;

export const EXTRACT_LIST_URLS_SCRIPT = `
(() => {
  const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.href);
  const re = /https?:\\/\\/(item\\.taobao\\.com|detail\\.tmall\\.com|detail\\.1688\\.com)[^"'\\s]*/gi;
  const found = new Set();
  for (const h of hrefs) {
    const m = h.match(re);
    if (m) m.forEach((u) => found.add(u.split('?')[0].split('#')[0]));
  }
  const html = document.documentElement.innerHTML;
  let match;
  while ((match = re.exec(html)) !== null) {
    found.add(match[0].split('?')[0].split('#')[0]);
  }
  return [...found];
})()
`;
