import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { getDbPath } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function migrate() {
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  const schemaFile = ['schema.sql', path.join('db', 'schema.sql')]
    .map((p) => path.join(__dirname, p))
    .concat([path.join(process.cwd(), 'src/db/schema.sql'), path.join(process.cwd(), 'dist/db/schema.sql')])
    .find((p) => fs.existsSync(p));
  if (!schemaFile) throw new Error('schema.sql not found');
  const schema = fs.readFileSync(schemaFile, 'utf8');
  db.exec(schema);
  const batchSchemaPath = path.join(__dirname, 'schema-batch.sql');
  if (fs.existsSync(batchSchemaPath)) {
    db.exec(fs.readFileSync(batchSchemaPath, 'utf8'));
  }
  const publishP1Path = path.join(__dirname, 'schema-publish-p1.sql');
  if (fs.existsSync(publishP1Path)) {
    for (const stmt of fs
      .readFileSync(publishP1Path, 'utf8')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)) {
      try {
        db.exec(stmt);
      } catch {
        /* column/table may already exist */
      }
    }
  }
  // P2: 核心数据字段补全
  const productFieldsPath = path.join(__dirname, 'schema-product-fields.sql');
  if (fs.existsSync(productFieldsPath)) {
    for (const stmt of fs
      .readFileSync(productFieldsPath, 'utf8')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)) {
      try {
        db.exec(stmt);
      } catch {
        /* column/table may already exist */
      }
    }
  }
  const templatesP2Path = path.join(__dirname, 'schema-templates-p2.sql');
  if (fs.existsSync(templatesP2Path)) {
    for (const stmt of fs
      .readFileSync(templatesP2Path, 'utf8')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)) {
      try {
        db.exec(stmt);
      } catch {
        /* column may already exist */
      }
    }
  }
  seedIfEmpty(db);
  db.close();
  return dbPath;
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c > 0) return;

  const now = new Date().toISOString();
  const userId = 'user-admin01';
  const hash = bcrypt.hashSync('abcd234', 10);
  db.prepare(
    'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)',
  ).run(userId, 'admin01', hash, now);

  const extToken = `psa_${crypto.randomUUID().replace(/-/g, '')}`;
  db.prepare(
    'INSERT INTO extension_tokens (user_id, token, created_at) VALUES (?, ?, ?)',
  ).run(userId, extToken, now);

  const products = [
    ['p1', '韩版童装连衣裙夏季女童公主裙', '1688', 'https://detail.1688.com/offer/example-01', 28.5, 'raw', '童装', 'vi-VN'],
    ['p2', '儿童纯棉短袖T恤男女童打底衫', '淘宝', 'https://item.taobao.com/item.htm?id=example02', 19.9, 'processing', '童装', 'vi-VN'],
    ['p3', '婴儿连体衣新生儿哈衣爬服', '链接采集', 'https://example.com/product/3', 35, 'ready', '童装', 'vi-VN'],
    ['p4', '泰式儿童防晒外套轻薄透气', '1688', 'https://detail.1688.com/offer/example-04', 44.8, 'ready', '童装', 'th-TH'],
    ['p5', '女童牛仔背带裤夏款百搭', '拼多多', 'https://mobile.yangkeduo.com/goods5', 27.2, 'published', '童装', 'th-TH'],
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, user_id, title, source, source_url, price_cny, status, category, thumb,
      target_locale, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const [id, title, source, url, price, status, cat, locale] of products) {
    const thumb = `https://placehold.co/80x80/e2e8f0/64748b?text=${encodeURIComponent(String(id))}`;
    insertProduct.run(id, userId, title, source, url, price, status, cat, thumb, locale, now, now);
  }

  const templates = [
    ['t1', '童装 · 标题优化', 'active', '首期跑通模板', '中文/越南语'],
    ['t2', '男装 · 标题优化', 'draft', '待扩展', '中文/泰语'],
  ];
  const insertTpl = db.prepare(`
    INSERT INTO category_templates (id, user_id, name, status, note, language, prompt_body, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const [id, name, status, note, lang] of templates) {
    insertTpl.run(id, userId, name, status, note, lang, '你是童装跨境标题专家…', now, now);
  }

  const rules = [
    ['r1', '越南 Shopee 定价', 'price_vnd = price_cny * 3.5', 'pricing'],
    ['r2', '泰国 TikTok 定价', 'price_thb = price_cny * 2.5', 'pricing'],
    ['r3', '菲律宾 Shopee 固定价', 'price_php = 500', 'pricing'],
    ['r4', '标题字数(越南)', 'len(title) <= 20', 'title'],
    ['r5', '违禁词过滤', 'check_blacklist(title, description)', 'safety'],
    ['r6', '品牌检查', 'check_brand_names(title)', 'safety'],
    ['r7', '自动翻译', 'translate(title, target_locale)', 'translation'],
  ];
  const insertRule = db.prepare(
    'INSERT INTO rule_items (id, user_id, name, expr, rule_group, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  for (const [id, name, expr, group] of rules) {
    insertRule.run(id, userId, name, expr, group, now);
  }

  db.prepare(`
    INSERT INTO publish_tasks (id, user_id, platform, title, status, reason, created_at, updated_at)
    VALUES ('pub1', ?, 'Shopee', '婴儿连体衣新生儿哈衣爬服', 'pending', NULL, ?, ?),
           ('pub2', ?, 'TikTok Shop', '儿童纯棉短袖T恤', 'completed', NULL, ?, ?),
           ('pub3', ?, '淘宝', '泰式儿童防晒外套', 'failed', '选择器失效', ?, ?)
  `).run(userId, now, now, userId, now, now, userId, now, now);

  db.prepare(`
    INSERT INTO insight_jobs (id, user_id, status, keywords_json, top_features_json, updated_at)
    VALUES ('insight-1', ?, 'done', ?, ?, ?)
  `).run(
    userId,
    JSON.stringify([
      { keyword: '纯棉', score: 92 },
      { keyword: '透气', score: 88 },
    ]),
    JSON.stringify(['主图：白底 + 模特正面', '标题：年龄段 + 材质 + 场景']),
    now,
  );
}

if (process.argv[1]?.includes('migrate')) {
  console.log('Migrated:', migrate());
}
