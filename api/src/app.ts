import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { API_PREFIX } from './config.js';
import { getDb } from './db/index.js';
import { extensionAuth, jwtAuth, signAccessToken, signRefreshToken } from './middleware/auth.js';
import { fail, ok, uid } from './lib/response.js';
import {
  createProduct,
  getProduct,
  ingestCollect,
  listProducts,
  patchProduct,
  runProductPipeline,
} from './services/products.js';
import {
  batchJobToApi,
  createBatchJob,
  getBatchJob,
  listBatchJobs,
} from './services/batchJobs.js';
import { listCookieDomains, saveCookieJar, type StoredCookie } from './services/cookieJar.js';
import { scheduleBatchJob } from './worker/batchCollect.js';
import { loadAllSellerSelectors } from './worker/selectors.js';
import {
  getLatestFillPayload,
  getPublishTask,
  preparePublishTask,
} from './services/publishTasks.js';
import { createImageJob, getImageJob, listImageJobs } from './services/imageJobs.js';
import { encodeSku, encodeDummyHookSku } from './domain/listing.js';
import { registerV2Routes } from './v2/routes.js';

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

app.get('/extension/selectors', jwtAuth, (c) => {
  return ok(c, loadAllSellerSelectors());
});

app.get('/extension/publish-fill', extensionAuth, (c) => {
  const platform = c.req.query('platform') ?? 'tiktok';
  const data = getLatestFillPayload(getDb(), c.get('user').id, platform);
  if (!data) return fail(c, 'NO_PREPARED_TASK', 404, 404);
  return ok(c, data);
});

app.post('/extension/cookies', extensionAuth, async (c) => {
  const body = z
    .object({
      domain: z.string(),
      cookies: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
          domain: z.string(),
          path: z.string().optional(),
          secure: z.boolean().optional(),
          httpOnly: z.boolean().optional(),
          sameSite: z.enum(['Strict', 'Lax', 'None']).optional(),
          expirationDate: z.number().optional(),
        }),
      ),
      consent: z.literal(true),
    })
    .safeParse(await c.req.json());
  if (!body.success || !body.data.consent) return fail(c, 'CONSENT_REQUIRED');
  saveCookieJar(getDb(), c.get('user').id, body.data.domain, body.data.cookies as StoredCookie[]);
  return ok(c, { saved: true, domain: body.data.domain, count: body.data.cookies.length });
});

app.get('/extension/cookies', jwtAuth, (c) => ok(c, listCookieDomains(c.get('user').id)));

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

app.post('/collect-jobs/batch', jwtAuth, async (c) => {
  const body = z
    .object({
      listUrl: z.string().url(),
      maxItems: z.number().int().min(1).max(20).optional(),
      delayMsMin: z.number().int().min(100).max(5000).optional(),
      delayMsMax: z.number().int().min(200).max(10000).optional(),
      useCookies: z.boolean().optional(),
      requireUserConfirm: z.boolean().optional(),
      startImmediately: z.boolean().optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  if (body.data.requireUserConfirm !== true) return fail(c, 'USER_CONFIRM_REQUIRED');

  const job = createBatchJob(getDb(), c.get('user').id, {
    listUrl: body.data.listUrl,
    maxItems: body.data.maxItems,
    delayMsMin: body.data.delayMsMin,
    delayMsMax: body.data.delayMsMax,
    useCookies: body.data.useCookies,
    requireUserConfirm: true,
  });

  if (body.data.startImmediately !== false) {
    scheduleBatchJob(job.id, c.get('user').id);
  }

  return ok(c, batchJobToApi(job), 201);
});

app.get('/collect-jobs/batch', jwtAuth, (c) => {
  const jobs = listBatchJobs(getDb(), c.get('user').id).map(batchJobToApi);
  return ok(c, jobs);
});

app.get('/collect-jobs/batch/:id', jwtAuth, (c) => {
  const job = getBatchJob(getDb(), c.get('user').id, c.req.param('id'));
  if (!job) return fail(c, 'NOT_FOUND', 404, 404);
  return ok(c, batchJobToApi(job));
});

app.post('/collect-jobs/batch/:id/run', jwtAuth, (c) => {
  const job = getBatchJob(getDb(), c.get('user').id, c.req.param('id'));
  if (!job) return fail(c, 'NOT_FOUND', 404, 404);
  scheduleBatchJob(job.id, c.get('user').id);
  return ok(c, { scheduled: true, id: job.id });
});

app.get('/collect-adapters/:site', jwtAuth, (c) => {
  const site = c.req.param('site');
  if (site === 'taobao' || site === 'tmall') {
    return ok(c, {
      site,
      version: '1.0.0',
      layers: ['L1', 'L2', 'L4'],
      sellerSelectors: loadAllSellerSelectors().taobao,
    });
  }
  if (site === '1688') {
    return ok(c, { site, version: '1.0.0', layers: ['L1', 'L2', 'L4'] });
  }
  return ok(c, { site, version: '1.0.0', layers: ['L4'] });
});

// —— Products ——
app.get('/products', jwtAuth, (c) => {
  const status = c.req.query('status');
  const source = c.req.query('source');
  const keyword = c.req.query('keyword');
  const dateFrom = c.req.query('dateFrom');
  const dateTo = c.req.query('dateTo');
  return ok(c, listProducts(getDb(), c.get('user').id, {
    status: status || undefined,
    source: source || undefined,
    keyword: keyword || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }));
});

app.post('/products', jwtAuth, async (c) => {
  const body = z
    .object({
      title: z.string().min(1),
      source: z.string().default('upload'),
      sourceUrl: z.string().optional(),
      priceCny: z.number().optional(),
      thumb: z.string(),
      images: z.array(z.string()).optional(),
      targetLocale: z.enum(['vi-VN', 'th-TH', 'id-ID', 'fil-PH']).optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const product = createProduct(getDb(), c.get('user').id, body.data);
  return ok(c, product, 201);
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
      targetLocale: z.enum(['vi-VN', 'th-TH', 'id-ID', 'fil-PH']).optional(),
      priceCny: z.number().optional(),
      pipelineNote: z.string().optional(),
      description: z.string().optional(),
      categoryId: z.string().optional(),
      skus: z.array(z.record(z.unknown())).optional(),
      processed: z
        .object({
          exposure: z
            .object({
              title: z.string().optional(),
              shortDescription: z.string().optional(),
              priceLabel: z.string().optional(),
            })
            .optional(),
          conversion: z
            .object({
              title: z.string().optional(),
              shortDescription: z.string().optional(),
              priceLabel: z.string().optional(),
            })
            .optional(),
          selectedOutput: z.enum(['exposure', 'conversion']).optional(),
        })
        .optional(),
      attributes: z
        .object({
          logistics: z
            .object({
              weightGrams: z.number().optional(),
              packageDimensions: z
                .object({ length: z.number(), width: z.number(), height: z.number() })
                .optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const id = c.req.param('id');
  const userId = c.get('user').id;
  const updated = patchProduct(getDb(), userId, id, body.data);
  if (!updated) return fail(c, 'NOT_FOUND', 404, 404);
  return ok(c, updated);
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
    sku_config_json: string | null;
    category_id: string | null;
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
      categoryId: r.category_id ?? undefined,
      skuConfig: r.sku_config_json ? JSON.parse(r.sku_config_json) : undefined,
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
      categoryId: z.string().optional(),
      skuConfig: z.record(z.unknown()).optional(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const userId = c.get('user').id;
  const id = body.data.id ?? uid('t');
  const now = new Date().toISOString();
  const skuJson = body.data.skuConfig ? JSON.stringify(body.data.skuConfig) : null;
  getDb()
    .prepare(
      `INSERT INTO category_templates (id, user_id, name, status, note, language, prompt_body, sku_config_json, category_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status=excluded.status, note=excluded.note,
         language=excluded.language, prompt_body=excluded.prompt_body,
         sku_config_json=excluded.sku_config_json, category_id=excluded.category_id,
         updated_at=excluded.updated_at`,
    )
    .run(
      id,
      userId,
      body.data.name,
      body.data.status,
      body.data.note,
      body.data.language,
      body.data.promptBody,
      skuJson,
      body.data.categoryId ?? null,
      now,
      now,
    );
  return ok(c, { id, ...body.data }, 201);
});

app.delete('/category-templates/:id', jwtAuth, (c) => {
  getDb()
    .prepare('DELETE FROM category_templates WHERE id = ? AND user_id = ?')
    .run(c.req.param('id'), c.get('user').id);
  return ok(c, { deleted: true });
});

// —— SKU Encoding (BRD §4.2) ——
app.post('/sku/encode', jwtAuth, async (c) => {
  const body = z
    .object({
      prefix: z.string().default('BF'),
      sequence: z.number().int().min(1).max(1000),
      side: z.enum(['P', 'R', 'PR']),
      color: z.string(),
      size: z.string(),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const { prefix, sequence, side, color, size } = body.data;
  const skuCode = encodeSku({ prefix, sequence, side, color, size });
  return ok(c, { skuCode });
});

app.post('/sku/encode-batch', jwtAuth, async (c) => {
  const body = z
    .object({
      prefix: z.string().default('BF'),
      sequenceStart: z.number().int().min(1).default(1),
      colors: z.array(z.string()),
      sizes: z.array(z.string()),
      sides: z.array(z.enum(['P', 'R', 'PR'])).default(['PR']),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const { prefix, sequenceStart, colors, sizes, sides } = body.data;
  const skus: Array<{ skuCode: string; color: string; size: string; side: string }> = [];
  let seq = sequenceStart;
  for (const color of colors) {
    for (const size of sizes) {
      for (const side of sides) {
        try {
          skus.push({
            skuCode: encodeSku({ prefix, sequence: seq, side, color, size }),
            color,
            size,
            side,
          });
        } catch {
          // skip invalid combinations
        }
      }
      seq++;
    }
  }
  return ok(c, { skus, total: skus.length });
});

app.post('/sku/dummy-hook', jwtAuth, async (c) => {
  const body = z
    .object({
      prefix: z.string().default('BF'),
      size: z.string().default('M'),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const { prefix, size } = body.data;
  const skuCode = encodeDummyHookSku(prefix, size);
  return ok(c, {
    skuCode,
    color: 'empty',
    size,
    price: 400,
    stock: 5,
    weight: 220,
    isDummyHook: true,
  });
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
  const userId = c.get('user').id;
  const rows = getDb()
    .prepare('SELECT id FROM publish_tasks WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as Array<{ id: string }>;
  return ok(c, rows.map((r) => getPublishTask(getDb(), userId, r.id)).filter(Boolean));
});

app.get('/publish-tasks/:id', jwtAuth, (c) => {
  const task = getPublishTask(getDb(), c.get('user').id, c.req.param('id'));
  if (!task) return fail(c, 'NOT_FOUND', 404, 404);
  return ok(c, task);
});

app.post('/publish-tasks/:id/prepare', jwtAuth, (c) => {
  const result = preparePublishTask(getDb(), c.get('user').id, c.req.param('id'));
  if (!result) return fail(c, 'NOT_FOUND', 404, 404);
  return ok(c, result);
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

app.post('/products/:id/image-jobs', jwtAuth, async (c) => {
  const body = z
    .object({
      operations: z
        .array(z.enum(['dedupe_watermark', 'upscale', 'model_tryon', 'translate_overlay']))
        .min(1),
    })
    .safeParse(await c.req.json());
  if (!body.success) return fail(c, 'INVALID_BODY');
  const job = createImageJob(getDb(), c.get('user').id, c.req.param('id'), body.data.operations);
  if (!job) return fail(c, 'NOT_FOUND', 404, 404);
  return ok(c, job, 201);
});

app.get('/products/:id/image-jobs', jwtAuth, (c) => {
  return ok(c, listImageJobs(getDb(), c.get('user').id, c.req.param('id')));
});

app.get('/image-jobs/:id', jwtAuth, (c) => {
  const job = getImageJob(getDb(), c.get('user').id, c.req.param('id'));
  if (!job) return fail(c, 'NOT_FOUND', 404, 404);
  return ok(c, job);
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

registerV2Routes(app);

export { app };
