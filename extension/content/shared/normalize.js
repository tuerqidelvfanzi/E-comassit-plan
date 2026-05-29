/**
 * @param {object} p
 */
function buildProduct(p) {
  return {
    source: p.source,
    sourceUrl: location.href,
    title: String(p.title || '').trim() || document.title,
    price: {
      amount: typeof p.priceAmount === 'number' && !Number.isNaN(p.priceAmount) ? p.priceAmount : 0,
      currency: p.currency || 'CNY',
    },
    images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
    skus: Array.isArray(p.skus) ? p.skus : [],
    attributes: p.attributes && typeof p.attributes === 'object' ? p.attributes : {},
    capturedAt: new Date().toISOString(),
    extractMethod: p.extractMethod || 'dom',
    extractLayer: p.extractLayer || 'L4',
  };
}

globalThis.PsaNormalize = { buildProduct };
