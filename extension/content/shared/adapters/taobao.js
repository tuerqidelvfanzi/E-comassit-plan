(function () {
  const U = globalThis.PsaExtractUtils;
  const { deepFind, readGlobals, parsePriceNumber, uniqueStrings, absolutizeUrl } = U;

  function sourceLabel(hostname) {
    if (hostname.includes('tmall.com')) return '天猫';
    return '淘宝';
  }

  function mapTaobaoPayload(root) {
    if (!root || typeof root !== 'object') return null;

    const item =
      root.item ||
      root.itemDO ||
      root.itemInfo ||
      root.data?.item ||
      root.loaderData?.item ||
      root.detail?.item ||
      deepFind(root, (o) => o && (o.title || o.itemTitle) && (o.price || o.priceText || o.qianggouPrice));

    if (!item || typeof item !== 'object') return null;

    const title = item.title || item.itemTitle || item.name || item.subject;
    const priceRaw =
      item.price ||
      item.priceText ||
      item.qianggouPrice ||
      item.promoPrice ||
      item.originalPrice ||
      item.spucol?.price;

    const images = [];
    const pics = item.images || item.itemImgs || item.auctionImages || item.picUrlList;
    if (typeof item.pic === 'string') images.push(item.pic);
    if (Array.isArray(pics)) {
      for (const p of pics) {
        if (typeof p === 'string') images.push(absolutizeUrl(p));
        else if (p?.url) images.push(absolutizeUrl(p.url));
      }
    }

    const skus = [];
    const skuMap = item.skuMap || item.skuInfoMap || item.skus;
    if (skuMap && typeof skuMap === 'object' && !Array.isArray(skuMap)) {
      for (const [skuId, info] of Object.entries(skuMap)) {
        skus.push({
          id: skuId,
          name: info?.names || info?.name || skuId,
          price: parsePriceNumber(info?.price || info?.suggestivePromotionPrice),
        });
      }
    }

    if (!title) return null;

    return {
      title: String(title),
      priceAmount: parsePriceNumber(priceRaw),
      currency: 'CNY',
      images: uniqueStrings(images),
      skus,
      attributes: {
        itemId: item.itemId || item.num_iid || item.id,
        shopId: item.shopId || item.sellerId,
      },
    };
  }

  function l1Extract() {
    const globals = readGlobals([
      '__INITIAL_STATE__',
      '__INIT_DATA__',
      'g_config',
      'Hub.config.config',
      'pageData',
    ]);
    const inline = U.scanInlineScriptObjects();
    for (const g of [...globals, ...inline]) {
      const mapped = mapTaobaoPayload(g);
      if (mapped?.title) return mapped;
    }
    return null;
  }

  function l4Extract() {
    const title = U.queryText([
      '.tb-main-title',
      '.ItemHeader--mainTitle',
      '[class*="MainTitle"]',
      '[class*="ItemTitle"]',
      'h1',
    ]);
    const priceAmount = U.queryPrice([
      '.tb-rmb-num',
      '[class*="Price--priceText"]',
      '[class*="priceText"]',
      '.highlightPrice',
      '[class*="HighlightPrice"]',
      '#J_StrPrice',
      '.price',
    ]);
    const images = U.collectImageUrls(
      document.querySelectorAll(
        '#J_UlThumb img, .tb-thumb img, [class*="thumbnail"] img, [class*="MainPic"] img, [class*="PicGallery"] img',
      ),
    );
    if (!title && priceAmount <= 0 && images.length === 0) return null;
    return { title, priceAmount, currency: 'CNY', images, skus: [], attributes: {} };
  }

  globalThis.PsaExtractRegistry.register({
    id: 'taobao',
    sourceLabel: null,
    match(hostname) {
      return hostname.includes('taobao.com') || hostname.includes('tmall.com');
    },
    resolveSource(hostname) {
      return sourceLabel(hostname);
    },
    l1Extract,
    l4Extract,
  });
})();
