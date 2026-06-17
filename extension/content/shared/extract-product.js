(function () {
  const { buildProduct } = globalThis.PsaNormalize;
  const U = globalThis.PsaExtractUtils;
  const registry = globalThis.PsaExtractRegistry;

  function pickAdapter(hostname) {
    return registry.adapters.find((a) => a.match(hostname));
  }

  function extractProduct() {
    const hostname = location.hostname;
    const adapter = pickAdapter(hostname);

    if (!adapter) {
      return buildProduct({
        source: '源站',
        title: U.queryText(['h1']) || document.title,
        priceAmount: U.queryPrice(['[class*="price"]']),
        extractMethod: 'dom',
        extractLayer: 'L4',
      });
    }

    const source = adapter.resolveSource?.(hostname) || adapter.sourceLabel || '源站';

    const l1 = adapter.l1Extract?.();
    if (l1?.title) {
      return buildProduct({
        source,
        ...l1,
        extractMethod: 'json_embed',
        extractLayer: 'L1',
      });
    }

    const ld = U.mapJsonLdToPartial(U.extractJsonLdProduct());
    if (ld?.title) {
      return buildProduct({
        source,
        ...ld,
        extractMethod: 'json_ld',
        extractLayer: 'L2',
      });
    }

    const l4 = adapter.l4Extract?.();
    if (l4) {
      return buildProduct({
        source,
        ...l4,
        extractMethod: 'dom',
        extractLayer: 'L4',
      });
    }

    return buildProduct({
      source,
      title: document.title,
      priceAmount: 0,
      extractMethod: 'dom',
      extractLayer: 'L4',
    });
  }

  globalThis.PsaExtractProduct = { extractProduct, pickAdapter };
})();
