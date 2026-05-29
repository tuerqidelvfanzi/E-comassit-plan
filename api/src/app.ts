import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { API_PREFIX } from './config.js';
import { getDb } from './db/index.js';
import { extensionAuth, jwtAuth, signAccessToken, signRefreshToken } from './middleware/auth.js';
import { fail, ok, uid } from './lib/response.js';
import { getProduct, ingestCollect, listProducts, runProductPipeline } from './services/products.js';

const app = new Hono().basePath(API_PREFIX);

app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Extension-Token'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.get('/health', (c) => ok(c, { status: 'up', time: new Date().toISOString() }));

// —— Auth ——
app.post('/auth/login', async (c) => {
  const body = z
    .object({ username: z.string(), password: z.string() })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const row = getDb()
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .get(body.data.username) as { id: string; username: string; password_hash: string } | undefined;
  if (!row || !bcrypt.compareSync(body.data.password, row.password_hash)) {
    return fail(c, 'INVALID_CREDENTIALS', 401, 401 as const);
  }
  const user = { id: row.id, username: row.username };
  const accessToken = await signAccessToken(user);
  const refreshToken = await signRefreshToken(user);
  return ok(c, { accessToken, refreshToken, user });
});

app.get('/auth/me', jwtAuth, (c) => ok(c, c.get('user')));

// —— Extension ——
app.get('/extension/token', jwtAuth, (c) => {
  const user = c.get('user');
  const row = getDb()
    .prepare('SELECT token FROM extension_tokens WHERE user_id = ?')
    .get(user.id) as { token: string } | undefined;
  return ok(c, { token: row?.token ?? null });
});

app.post('/extension/token', jwtAuth, (c) => {
  const user = c.get('user');
  const token = `psa_${crypto.randomUUID().replace(/-/g, '')}`;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO extension_tokens (user_id, token, created_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET token = excluded.token, created_at = excluded.created_at`,
    )
    .run(user.id, token, now);
  return ok(c, { token });
});

app.get('/extension/selectors', jwtAuth, (c) =>
  ok(c, {
    shopee: { title: ['input[name*="title" i]', 'textarea[name*="title" i]'], price: ['input[name*="price" i]'] },
    taobao: { title: ['#title', 'input[placeholder*="标题" i]'], price: ['input[name*="price" i]'] },
    tiktok: { title: ['input[data-testid*="title" i]'], price: ['input[type="number"]'] },
  }),
);

// —— Collect ——
app.post('/collect-jobs', extensionAuth, async (c) => {
  const body = z.object({ payload: z.record(z.unknown()) }).safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  try {
    const result = ingestCollect(getDb(), c.get('user').id, body.data.payload);
    return ok(c, result, 201);
  } catch (e) {
    return fail(c, e instanceof Error ? e.message : 'INGEST_FAILED', 400);
  }
});

app.get('/collect-jobs', jwtAuth, (c) => {
  const rows = getDb()
    .prepare('SELECT * FROM collect_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
    .all(c.get('user').id);
  return ok(c, rows);
});

// —— Products ——
app.get('/products', jwtAuth, (c) => {
  const status = c.req.query('status');
  return ok(c, listProducts(getDb(), c.get('user').id, status));
});

app.get('/products/:id', jwtAuth, (c) => {
  const p = getProduct(getDb(), c.get('user').id, c.req.param('id'));
  if (!p) return fail(c, 'NOT_FOUND', 404, 404);
  return ok(c, p);
});

app.patch('/products/:id', jwtAuth, async (c) => {
  const body = z
    .object({
      title: z.string().optional(),
      status: z.enum(['raw', 'processing', 'ready', 'published']).optional(),
      targetLocale: z.enum(['vi-VN', 'th-TH']).optional(),
      priceCny: z.number().optional(),
      pipelineNote: z.string().optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const id = c.req.param('id');
  const userId = c.get('user').id;
  const existing = getProduct(getDb(), userId, id);
  if (!existing) return fail(c, 'NOT_FOUND', 404, 404);
  const now = new Date().toISOString();
  const d = body.data;
  getDb()
    .prepare(
      `UPDATE products SET
        title = COALESCE(?, title),
        status = COALESCE(?, status),
        target_locale = COALESCE(?, target_locale),
        price_cny = COALESCE(?, price_cny),
        pipeline_note = COALESCE(?, pipeline_note),
        updated_at = ?
      WHERE id = ? AND user_id = ?`,
    )
    .run(
      d.title ?? null,
      d.status ?? null,
      d.targetLocale ?? null,
      d.priceCny ?? null,
      d.pipelineNote ?? null,
      now,
      id,
      userId,
    );
  return ok(c, getProduct(getDb(), userId, id));
});

app.delete('/products/:id', jwtAuth, (c) => {
  const r = getDb()
    .prepare('DELETE FROM products WHERE id = ? AND user_id = ?')
    .run(c.req.param('id'), c.get('user').id);
  if (r.changes === 0) return fail(c, 'NOT_FOUND', 404, 404);
  return ok(c, { deleted: true });
});

// —— Pipeline ——
app.post('/products/:id/pipeline-runs', jwtAuth, async (c) => {
  const body = z
    .object({ templateId: z.string().optional(), adhocPrompt: z.string().optional() })
    .safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return fail(c, 'INVALID_BODY');
  try {
    const result = await runProductPipeline(getDb(), c.get('user').id, c.req.param('id'), body.data);
    return ok(c, result, 201);
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') return fail(c, 'NOT_FOUND', 404, 404);
    throw e;
  }
});

app.get('/products/:id/pipeline-runs', jwtAuth, (c) => {
  const rows = getDb()
    .prepare(
      'SELECT * FROM pipeline_runs WHERE user_id = ? AND product_id = ? ORDER BY started_at DESC',
    )
    .all(c.get('user').id, c.req.param('id'));
  return ok(c, rows);
});

// —— Templates ——
app.get('/category-templates', jwtAuth, (c) => {
  const rows = getDb()
    .prepare('SELECT * FROM category_templates WHERE user_id = ? ORDER BY created_at DESC')
    .all(c.get('user').id) as Array<{
    id: string;
    name: string;
    status: string;
    note: string;
    language: string;
    prompt_body: string;
  }>;
  return ok(
    c,
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      note: r.note,
      language: r.language,
      promptBody: r.prompt_body,
    })),
  );
});

app.post('/category-templates', jwtAuth, async (c) => {
  const body = z
    .object({
      id: z.string().optional(),
      name: z.string(),
      status: z.enum(['active', 'draft']).default('draft'),
      note: z.string().default(''),
      language: z.string().default(''),
      promptBody: z.string().default(''),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const userId = c.get('user').id;
  const id = body.data.id ?? uid('t');
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO category_templates (id, user_id, name, status, note, language, prompt_body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status=excluded.status, note=excluded.note,
         language=excluded.language, prompt_body=excluded.prompt_body, updated_at=excluded.updated_at`,
    )
    .run(id, userId, body.data.name, body.data.status, body.data.note, body.data.language, body.data.promptBody, now, now);
  return ok(c, { id, ...body.data }, 201);
});

app.delete('/category-templates/:id', jwtAuth, (c) => {
  getDb()
    .prepare('DELETE FROM category_templates WHERE id = ? AND user_id = ?')
    .run(c.req.param('id'), c.get('user').id);
  return ok(c, { deleted: true });
});

// —— Rules ——
app.get('/rule-sets', jwtAuth, (c) => {
  const rows = getDb()
    .prepare('SELECT * FROM rule_items WHERE user_id = ? ORDER BY created_at DESC')
    .all(c.get('user').id) as Array<{ id: string; name: string; expr: string; rule_group: string }>;
  return ok(
    c,
    rows.map((r) => ({ id: r.id, name: r.name, expr: r.expr, group: r.rule_group })),
  );
});

app.post('/rule-sets', jwtAuth, async (c) => {
  const body = z
    .object({
      name: z.string(),
      expr: z.string(),
      group: z.enum(['pricing', 'title', 'safety', 'translation']),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const id = uid('r');
  const now = new Date().toISOString();
  getDb()
    .prepare(
      'INSERT INTO rule_items (id, user_id, name, expr, rule_group, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(id, c.get('user').id, body.data.name, body.data.expr, body.data.group, now);
  return ok(c, { id, ...body.data }, 201);
});

app.delete('/rule-sets/:id', jwtAuth, (c) => {
  getDb()
    .prepare('DELETE FROM rule_items WHERE id = ? AND user_id = ?')
    .run(c.req.param('id'), c.get('user').id);
  return ok(c, { deleted: true });
});

// —— Insights ——
app.get('/insights/latest', jwtAuth, (c) => {
  const row = getDb()
    .prepare('SELECT * FROM insight_jobs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
    .get(c.get('user').id) as
    | { status: string; keywords_json: string; top_features_json: string; updated_at: string }
    | undefined;
  if (!row) return ok(c, { status: 'idle', keywords: [], topFeatures: [] });
  return ok(c, {
    status: row.status,
    keywords: JSON.parse(row.keywords_json),
    topFeatures: JSON.parse(row.top_features_json),
    updatedAt: row.updated_at,
  });
});

app.post('/insights/run', jwtAuth, (c) => {
  const userId = c.get('user').id;
  const now = new Date().toISOString();
  const keywords = [
    { keyword: '纯棉', score: 90 + Math.floor(Math.random() * 8) },
    { keyword: '透气', score: 85 + Math.floor(Math.random() * 10) },
    { keyword: '女童', score: 82 + Math.floor(Math.random() * 12) },
  ];
  const topFeatures = ['主图：白底 + 模特正面', '标题：年龄段 + 材质 + 场景', `更新 ${now}`];
  getDb()
    .prepare(
      `INSERT INTO insight_jobs (id, user_id, status, keywords_json, top_features_json, updated_at)
       VALUES ('insight-1', ?, 'done', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET status='done', keywords_json=excluded.keywords_json,
         top_features_json=excluded.top_features_json, updated_at=excluded.updated_at`,
    )
    .run(userId, JSON.stringify(keywords), JSON.stringify(topFeatures), now);
  return ok(c, { status: 'done', keywords, topFeatures, updatedAt: now });
});

// —— Publish ——
app.get('/publish-tasks', jwtAuth, (c) => {
  const rows = getDb()
    .prepare('SELECT * FROM publish_tasks WHERE user_id = ? ORDER BY created_at DESC')
    .all(c.get('user').id) as Array<{
    id: string;
    platform: string;
    title: string;
    status: string;
    reason: string | null;
    product_id: string | null;
  }>;
  return ok(
    c,
    rows.map((r) => ({
      id: r.id,
      platform: r.platform,
      title: r.title,
      status: r.status,
      reason: r.reason ?? undefined,
      productId: r.product_id ?? undefined,
    })),
  );
});

app.post('/publish-tasks', jwtAuth, async (c) => {
  const body = z
    .object({
      platform: z.enum(['Shopee', 'TikTok Shop', '淘宝']),
      title: z.string(),
      productId: z.string().optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const id = uid('pub');
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO publish_tasks (id, user_id, platform, title, status, product_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    )
    .run(id, c.get('user').id, body.data.platform, body.data.title, body.data.productId ?? null, now, now);
  return ok(c, { id, status: 'pending', ...body.data }, 201);
});

app.patch('/publish-tasks/:id', jwtAuth, async (c) => {
  const body = z
    .object({
      status: z.enum(['pending', 'completed', 'failed']).optional(),
      reason: z.string().optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE publish_tasks SET status = COALESCE(?, status), reason = COALESCE(?, reason), updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(body.data.status ?? null, body.data.reason ?? null, now, c.req.param('id'), c.get('user').id);
  return ok(c, { updated: true });
});

// Metrics helper
app.get('/dashboard/metrics', jwtAuth, (c) => {
  const userId = c.get('user').id;
  const rows = getDb()
    .prepare('SELECT status, COUNT(*) as c FROM products WHERE user_id = ? GROUP BY status')
    .all(userId) as Array<{ status: string; c: number }>;
  const map = Object.fromEntries(rows.map((r) => [r.status, r.c]));
  const total = rows.reduce((s, r) => s + r.c, 0);
  return ok(c, {
    totalProducts: total,
    rawCount: map.raw ?? 0,
    processingCount: map.processing ?? 0,
    readyCount: map.ready ?? 0,
    publishedCount: map.published ?? 0,
  });
});

export { app };
