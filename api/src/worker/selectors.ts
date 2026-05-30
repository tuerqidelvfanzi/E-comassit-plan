import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveSelectorFile(name: string): string | undefined {
  const candidates = [
    path.join(__dirname, '../../../../shared/selectors', name),
    path.join(process.cwd(), '../shared/selectors', name),
    path.join(process.cwd(), 'shared/selectors', name),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function loadJsonSelector(name: string, fallback: Record<string, unknown>) {
  const file = resolveSelectorFile(name);
  if (!file) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
}

export function loadTaobaoSellerSelectors() {
  return loadJsonSelector('taobao-seller.json', {
    version: '1.0.0',
    platform: 'taobao',
    title: ['#sell-field-title input', 'input[name="title"]'],
    price: ['#sell-field-price input', 'input[name="price"]'],
    stock: ['input[name="quantity"]'],
  });
}

export function loadTiktokSellerSelectors() {
  return loadJsonSelector('tiktok-seller.json', {
    version: '1.0.0',
    platform: 'tiktok',
    title: ['input[data-testid*="title" i]'],
    price: ['input[type="number"]'],
    stock: ['input[name="quantity"]'],
    brand: ['input[data-testid="brand-input"]'],
    logistics: { weight: ['input[name="weight"]'] },
  });
}

export function loadAllSellerSelectors() {
  return {
    taobao: loadTaobaoSellerSelectors(),
    tiktok: loadTiktokSellerSelectors(),
    shopee: {
      version: '1.0.0',
      platform: 'shopee',
      title: ['input[name*="title" i]', 'textarea[name*="title" i]', '[data-testid*="title"] input'],
      price: ['input[name*="price" i]', 'input[placeholder*="价格" i]'],
      stock: ['input[name*="stock" i]', 'input[placeholder*="库存" i]'],
    },
  };
}
