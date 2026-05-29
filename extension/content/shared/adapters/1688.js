(function () {
  const U = globalThis.PsaExtractUtils;
  const { deepFind, readGlobals, parsePriceNumber, uniqueStrings, absolutizeUrl } = U;

  function map1688Payload(root) {
    if (!root || typeof root !== 'object') return null;

    const offer =
      root.offerDetail ||
      root.data?.offerDetail ||
      root.globalData?.offerDetail ||
      root.globalData?.offerBaseInfo ||
      root.result?.data ||
      root.data?.offerBaseInfo ||
      deepFind(root, (o) => o && (o.subject || o.offerTitle) && (o.priceRange || o.price || o.salePrice));

    if (!offer || typeof offer !== 'object') return null;

    const title =
      offer.subject ||
      offer.title ||
      offer.offerTitle ||
      offer.productTitle ||
      offer.name;

    const priceRaw =
      offer.priceRange?.price ||
      offer.priceRange?.minPrice ||
      offer.price ||
      offer.salePrice ||
      offer.retailPrice ||
      offer.tradePrice;

    const images = [];
    const imageList =
      offer.imageList ||
      offer.images ||
      offer.productImageList ||
      offer.mainImageList ||
      offer.image?.images;
    if (Array.isArray(imageList)) {
      for (const img of imageList) {
        if (typeof img === 'string') images.push(absolutizeUrl(img));
        else if (img?.fullPathImageURI) images.push(absolutizeUrl(img.fullPathImageURI));
        else if (img?.imageURI) images.push(absolutizeUrl(img.imageURI));
        else if (img?.url) images.push(absolutizeUrl(img.url));
      }
    }

    const skus = [];
    const skuModel = offer.skuModel || offer.skuMap || offer.skuProps;
    if (skuModel?.skuInfoMap && typeof skuModel.skuInfoMap === 'object') {
      for (const [skuId, info] of Object.entries(skuModel.skuInfoMap)) {
        skus.push({
          id: skuId,
          name: info?.specAttrs || info?.name || skuId,
          price: parsePriceNumber(info?.price || info?.discountPrice),
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
        offerId: offer.offerId || offer.id,
        sellerId: offer.sellerId || offer.memberId,
      },
    };
  }

  function l1Extract() {
    const globals = readGlobals(['__INIT_DATA', '__initData', '__GLOBAL_DATA__', 'context', 'detailData']);
    const inline = U.scanInlineScriptObjects();
    for (const g of [...globals, ...inline]) {
      const mapped = map1688Payload(g);
      if (mapped?.title) return mapped;
    }
    return null;
  }

  function l4Extract() {
    const title = U.queryText([
      'h1.title-text',
      '.mod-detail-title h1',
      '.title-content h1',
      '.offer-title h1',
      'h1',
    ]);
    const priceAmount = U.queryPrice([
      '.price-text',
      '[class*="price-text"]',
      '.mod-detail-price .value',
      '[class*="price"]',
    ]);
    const images = U.collectImageUrls(
      document.querySelectorAll(
        '.detail-gallery-img img, .tab-pane img, .img-list-wrapper img, [class*="gallery"] img',
      ),
    );
    if (!title && priceAmount <= 0 && images.length === 0) return null;
    return { title, priceAmount, currency: 'CNY', images, skus: [], attributes: {} };
  }

  globalThis.PsaExtractRegistry.register({
    id: '1688',
    sourceLabel: '1688',
    match(hostname) {
      return hostname.includes('1688.com');
    },
    l1Extract,
    l4Extract,
  });
})();
