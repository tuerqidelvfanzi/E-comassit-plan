import type { Product } from './api/types';

export function exportProductsJson(products: Product[]) {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `products-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportProductsCsv(products: Product[]) {
  const header = ['id', 'title', 'source', 'sourceUrl', 'priceCny', 'status', 'category', 'targetLocale'];
  const rows = products.map((p) =>
    [p.id, p.title, p.source, p.sourceUrl, p.priceCny, p.status, p.category, p.targetLocale]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(','),
  );
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `products-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
