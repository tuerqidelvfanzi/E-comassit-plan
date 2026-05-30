import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadTaobaoSellerSelectors() {
  const candidates = [
    path.join(__dirname, '../../../../shared/selectors/taobao-seller.json'),
    path.join(process.cwd(), '../shared/selectors/taobao-seller.json'),
    path.join(process.cwd(), 'shared/selectors/taobao-seller.json'),
  ];
  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) {
    return {
      version: '1.0.0',
      platform: 'taobao',
      title: ['#sell-field-title input', 'input[name="title"]'],
      price: ['#sell-field-price input', 'input[name="price"]'],
    };
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
