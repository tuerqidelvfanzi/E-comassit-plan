function parseJsonSafe(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parsePriceNumber(raw) {
  if (raw == null) return 0;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  const s = String(raw).replace(/,/g, '');
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function uniqueStrings(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const v = String(item || '').trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function absolutizeUrl(url) {
  if (!url) return '';
  const u = String(url).trim();
  if (u.startsWith('//')) return `${location.protocol}${u}`;
  if (u.startsWith('http')) return u;
  if (u.startsWith('/')) return `${location.origin}${u}`;
  return u;
}

function collectImageUrls(nodes) {
  const urls = [];
  for (const el of nodes) {
    if (!el) continue;
    const src =
      el.getAttribute('src') ||
      el.getAttribute('data-src') ||
      el.getAttribute('data-lazy-src') ||
      el.getAttribute('data-ks-lazyload');
    if (src) urls.push(absolutizeUrl(src));
  }
  return uniqueStrings(urls);
}

function queryText(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text) return text;
  }
  return '';
}

function queryPrice(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const text = el?.textContent || el?.getAttribute('content') || '';
    const n = parsePriceNumber(text);
    if (n > 0) return n;
  }
  return 0;
}

/** @param {object} obj */
function deepFind(obj, test, depth = 0, max = 14) {
  if (!obj || typeof obj !== 'object' || depth > max) return null;
  if (test(obj)) return obj;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const hit = deepFind(item, test, depth + 1, max);
      if (hit) return hit;
    }
    return null;
  }
  for (const value of Object.values(obj)) {
    const hit = deepFind(value, test, depth + 1, max);
    if (hit) return hit;
  }
  return null;
}

function readGlobals(names) {
  const out = [];
  for (const name of names) {
    try {
      const parts = name.split('.');
      let cur = window;
      for (const p of parts) {
        if (cur == null) {
          cur = undefined;
          break;
        }
        cur = cur[p];
      }
      if (cur != null) out.push(cur);
    } catch {
      /* ignore */
    }
  }
  return out;
}

function scanInlineScriptObjects() {
  const found = [];
  const scripts = document.querySelectorAll('script:not([src])');
  const assignRe = /(?:window\.)?([A-Za-z_$][\w$]*)\s*=\s*(\{[\s\S]*?\});/g;

  for (const script of scripts) {
    const text = script.textContent || '';
    if (text.length < 40 || text.length > 2_000_000) continue;

    let m;
    while ((m = assignRe.exec(text))) {
      const parsed = parseJsonSafe(m[2]);
      if (parsed) found.push(parsed);
    }

    const jsonLdLike = text.match(/\{[\s\S]*"title"[\s\S]*"price"[\s\S]*\}/);
    if (jsonLdLike) {
      const parsed = parseJsonSafe(jsonLdLike[0]);
      if (parsed) found.push(parsed);
    }
  }
  return found;
}

/** L2: Schema.org Product */
function extractJsonLdProduct() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const node of scripts) {
    const data = parseJsonSafe(node.textContent);
    if (!data) continue;
    const list = Array.isArray(data) ? data : [data];
    for (const item of list) {
      if (item['@type'] === 'Product' || String(item['@type'] || '').includes('Product')) {
        return item;
      }
      if (item['@graph']) {
        for (const g of item['@graph']) {
          if (g['@type'] === 'Product' || String(g['@type'] || '').includes('Product')) return g;
        }
      }
    }
  }
  return null;
}

function mapJsonLdToPartial(ld) {
  if (!ld) return null;
  const offers = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
  const images = [];
  if (typeof ld.image === 'string') images.push(ld.image);
  else if (Array.isArray(ld.image)) images.push(...ld.image);
  else if (ld.image?.url) images.push(ld.image.url);

  return {
    title: ld.name || ld.title,
    priceAmount: parsePriceNumber(offers?.price ?? offers?.lowPrice ?? ld.price),
    currency: offers?.priceCurrency || 'CNY',
    images: uniqueStrings(images.map(absolutizeUrl)),
    attributes: { brand: ld.brand?.name || ld.brand, sku: ld.sku },
  };
}

globalThis.PsaExtractUtils = {
  parseJsonSafe,
  parsePriceNumber,
  uniqueStrings,
  absolutizeUrl,
  collectImageUrls,
  queryText,
  queryPrice,
  deepFind,
  readGlobals,
  scanInlineScriptObjects,
  extractJsonLdProduct,
  mapJsonLdToPartial,
};
