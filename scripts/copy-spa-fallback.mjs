import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web/dist');
const index = path.join(dist, 'index.html');
const fallback = path.join(dist, '404.html');

if (!fs.existsSync(index)) {
  console.error('Missing', index, '— run vite build first');
  process.exit(1);
}

fs.copyFileSync(index, fallback);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('Copied index.html → 404.html and wrote .nojekyll');
