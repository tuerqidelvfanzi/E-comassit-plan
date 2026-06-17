import fs from 'node:fs';
import path from 'node:path';

const src = path.join(process.cwd(), 'src/db/schema.sql');
const dest = path.join(process.cwd(), 'dist/db/schema.sql');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
