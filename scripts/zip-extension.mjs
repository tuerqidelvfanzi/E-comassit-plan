import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extDir = path.join(root, 'extension');
const outDir = path.join(root, 'web', 'public', 'downloads');
const zipPath = path.join(outDir, 'ecommerce-assistant-extension-demo.zip');

const iconsDir = path.join(extDir, 'icons');
if (!fs.existsSync(path.join(iconsDir, 'icon48.png'))) {
  console.warn('extension/icons missing — run: python scripts/gen-extension-icons.py (or ensure icons/ exists)');
}

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

const isWin = process.platform === 'win32';
if (isWin) {
  const dest = zipPath.replace(/'/g, "''");
  const src = path.join(extDir, '*').replace(/'/g, "''");
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${src}' -DestinationPath '${dest}' -Force"`,
    { stdio: 'inherit' },
  );
} else {
  execSync(`cd "${extDir}" && zip -r "${zipPath}" . -x "*.DS_Store"`, { stdio: 'inherit' });
}

console.log('Created', zipPath);
