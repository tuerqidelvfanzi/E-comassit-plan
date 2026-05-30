import type Database from 'better-sqlite3';
import { runPipeline, type TargetLocale } from '../domain/pipeline.js';
import { uid } from '../lib/response.js';

export type ProductListFilters = {
  status?: string;
  source?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ProductRow = {
  id: string;
  user_id: string;
  title: string;
  source: string;
  source_url: string;
  price_cny: number;
  status: string;
  category: string;
  thumb: string;
  target_locale: string;
  captured_at: string | null;
  from_extension: number;
  extract_layer: string | null;
  extract_method: string | null;
  images_json: string;
  skus_json: string;
  attributes_json: string;
  raw_capture_json: string | null;
  processed_json: string | null;
  pipeline_note: string | null;
  created_at: string;
  updated_at: string;
  has_variants?: number;
  sku_count?: number;
  image_count?: number;
  category_id?: string | null;
};

type ProductAttributes = {
  description?: string;
  categoryId?: string;
  logistics?: { weightGrams?: number; packageDimensions?: { length: number; width: number; height: number } };
};

export function rowToApi(row: ProductRow) {
  const images = JSON.parse(row.images_json || '[]');
  const skus = JSON.parse(row.skus_json || '[]');
  const attrs = JSON.parse(row.attributes_json || '{}') as ProductAttributes;
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    sourceUrl: row.source_url,
    priceCny: row.price_cny,
    status: row.status,
    category: row.category,
    categoryId: row.category_id ?? attrs.categoryId,
    thumb: row.thumb,
    targetLocale: row.target_locale as TargetLocale,
    capturedAt: row.captured_at,
    fromExtension: row.from_extension === 1,
    extractLayer: row.extract_layer ?? undefined,
    extractMethod: row.extract_method ?? undefined,
    images,
    skus,
    description: attrs.description,
    attributes: attrs,
    hasVariants: row.has_variants === 1,
    skuCount: row.sku_count ?? skus.length,
    imageCount: row.image_count ?? (Array.isArray(images) ? images.length : 0),
    rawCapture: row.raw_capture_json ? JSON.parse(row.raw_capture_json) : undefined,
    processed: row.processed_json ? JSON.parse(row.processed_json) : undefined,
    pipelineNote: row.pipeline_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dateFieldSql() {
  return `COALESCE(captured_at, created_at)`;
}

export function listProducts(
  db: Database.Database,
  userId: string,
  filters: ProductListFilters = {},
) {
  let sql = 'SELECT * FROM products WHERE user_id = ?';
  const params: (string | number)[] = [userId];

  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.source) {
    sql += ' AND source = ?';
    params.push(filters.source);
  }
  if (filters.keyword) {
    sql += ' AND title LIKE ?';
    params.push(`%${filters.keyword}%`);
  }
  if (filters.dateFrom) {
    sql += ` AND date(${dateFieldSql()}) >= date(?)`;
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    sql += ` AND date(${dateFieldSql()}) <= date(?)`;
    params.push(filters.dateTo);
  }

  sql += ' ORDER BY created_at DESC';
  return (db.prepare(sql).all(...params) as ProductRow[]).map(rowToApi);
}

export function getProduct(db: Database.Database, userId: string, id: string) {
  const row = db
    .prepare('SELECT * FROM products WHERE user_id = ? AND id = ?')
    .get(userId, id) as ProductRow | undefined;
  return row ? rowToApi(row) : null;
}

export function createProduct(
  db: Database.Database,
  userId: string,
  input: {
    title: string;
    source: string;
    sourceUrl?: string;
    priceCny?: number;
    thumb: string;
    images?: string[];
    targetLocale?: TargetLocale;
    capturedAt?: string;
  },
) {
  const now = new Date().toISOString();
  const productId = uid('prd');
  const images = input.images ?? [input.thumb];
  const skus: unknown[] = [];

  db.prepare(
    `INSERT INTO products (
      id, user_id, title, source, source_url, price_cny, status, category, thumb,
      target_locale, captured_at, from_extension, extract_layer, extract_method,
      images_json, skus_json, attributes_json, raw_capture_json, created_at, updated_at,
      has_variants, sku_count, image_count
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    productId,
    userId,
    input.title,
    input.source,
    input.sourceUrl ?? '',
    input.priceCny ?? 0,
    'raw',
    '上传',
    input.thumb,
    input.targetLocale ?? 'vi-VN',
    input.capturedAt ?? now,
    0,
    null,
    null,
    JSON.stringify(images),
    JSON.stringify(skus),
    JSON.stringify({}),
    null,
    now,
    now,
    0,
    0,
    images.length,
  );

  return getProduct(db, userId, productId)!;
}

export type ProductPatch = {
  title?: string;
  status?: string;
  targetLocale?: TargetLocale;
  priceCny?: number;
  pipelineNote?: string;
  skus?: unknown[];
  description?: string;
  categoryId?: string;
  processed?: {
    exposure?: { title?: string; shortDescription?: string; priceLabel?: string };
    conversion?: { title?: string; shortDescription?: string; priceLabel?: string };
    selectedOutput?: 'exposure' | 'conversion';
    ranAt?: string;
    promptNote?: string;
    templateId?: string;
    modelUsed?: string;
  };
  attributes?: ProductAttributes;
};

export function patchProduct(
  db: Database.Database,
  userId: string,
  id: string,
  patch: ProductPatch,
) {
  const row = db
    .prepare('SELECT * FROM products WHERE user_id = ? AND id = ?')
    .get(userId, id) as ProductRow | undefined;
  if (!row) return null;

  const now = new Date().toISOString();
  const attrs = JSON.parse(row.attributes_json || '{}') as ProductAttributes;

  if (patch.description !== undefined) attrs.description = patch.description;
  if (patch.categoryId !== undefined) attrs.categoryId = patch.categoryId;
  if (patch.attributes?.logistics) {
    attrs.logistics = { ...attrs.logistics, ...patch.attributes.logistics };
  }

  let processedJson = row.processed_json;
  if (patch.processed) {
    const prev = row.processed_json ? JSON.parse(row.processed_json) : {};
    processedJson = JSON.stringify({
      ...prev,
      exposure: { ...prev.exposure, ...patch.processed.exposure },
      conversion: { ...prev.conversion, ...patch.processed.conversion },
      selectedOutput: patch.processed.selectedOutput ?? prev.selectedOutput,
      ranAt: patch.processed.ranAt ?? prev.ranAt,
      promptNote: patch.processed.promptNote ?? prev.promptNote,
      templateId: patch.processed.templateId ?? prev.templateId,
      modelUsed: patch.processed.modelUsed ?? prev.modelUsed,
    });
  }

  const skusJson = patch.skus !== undefined ? JSON.stringify(patch.skus) : row.skus_json;
  const skuCount = patch.skus !== undefined ? patch.skus.length : row.sku_count;

  db.prepare(
    `UPDATE products SET
      title = COALESCE(?, title),
      status = COALESCE(?, status),
      target_locale = COALESCE(?, target_locale),
      price_cny = COALESCE(?, price_cny),
      pipeline_note = COALESCE(?, pipeline_note),
      skus_json = COALESCE(?, skus_json),
      attributes_json = ?,
      processed_json = COALESCE(?, processed_json),
      category_id = COALESCE(?, category_id),
      sku_count = COALESCE(?, sku_count),
      has_variants = CASE WHEN ? IS NOT NULL THEN CASE WHEN ? > 0 THEN 1 ELSE 0 END ELSE has_variants END,
      updated_at = ?
    WHERE id = ? AND user_id = ?`,
  ).run(
    patch.title ?? null,
    patch.status ?? null,
    patch.targetLocale ?? null,
    patch.priceCny ?? null,
    patch.pipelineNote ?? null,
    patch.skus !== undefined ? skusJson : null,
    JSON.stringify(attrs),
    processedJson,
    patch.categoryId ?? null,
    skuCount ?? null,
    patch.skus !== undefined ? skuCount : null,
    patch.skus !== undefined ? skuCount : null,
    now,
    id,
    userId,
  );

  return getProduct(db, userId, id);
}

export function ingestCollect(
  db: Database.Database,
  userId: string,
  payload: Record<string, unknown>,
) {
  const title = String(payload.title ?? '');
  const sourceUrl = String(payload.sourceUrl ?? '');
  if (!title || !sourceUrl) throw new Error('INVALID_PAYLOAD');

  const now = new Date().toISOString();
  const productId = uid('ext');
  const images = Array.isArray(payload.images) ? payload.images : [];
  const skus = Array.isArray(payload.skus) ? payload.skus : [];
  const thumb =
    (images[0] as string) ||
    `https://placehold.co/80x80/073642/93a1a1?text=${encodeURIComponent(String(payload.source ?? 'NEW').slice(0, 4))}`;

  db.prepare(
    `INSERT INTO products (
      id, user_id, title, source, source_url, price_cny, status, category, thumb,
      target_locale, captured_at, from_extension, extract_layer, extract_method,
      images_json, skus_json, attributes_json, raw_capture_json, created_at, updated_at,
      has_variants, sku_count, image_count
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    productId,
    userId,
    title,
    String(payload.source ?? 'unknown'),
    sourceUrl,
    Number((payload.price as { amount?: number })?.amount ?? 0),
    'raw',
    '童装',
    thumb,
    'vi-VN',
    String(payload.capturedAt ?? now),
    1,
    payload.extractLayer ?? null,
    payload.extractMethod ?? null,
    JSON.stringify(images),
    JSON.stringify(skus),
    JSON.stringify(payload.attributes ?? {}),
    JSON.stringify(payload),
    now,
    now,
    skus.length > 0 ? 1 : 0,
    skus.length,
    images.length,
  );

  const jobId = uid('job');
  db.prepare(
    `INSERT INTO collect_jobs (id, user_id, status, source_url, product_id, payload_json, created_at)
     VALUES (?, ?, 'done', ?, ?, ?, ?)`,
  ).run(jobId, userId, sourceUrl, productId, JSON.stringify(payload), now);

  return { jobId, product: getProduct(db, userId, productId)! };
}

export async function runProductPipeline(
  db: Database.Database,
  userId: string,
  productId: string,
  opts: { templateId?: string; adhocPrompt?: string },
) {
  const row = db
    .prepare('SELECT * FROM products WHERE user_id = ? AND id = ?')
    .get(userId, productId) as ProductRow | undefined;
  if (!row) throw new Error('NOT_FOUND');

  const runId = uid('run');
  const started = new Date().toISOString();
  db.prepare(
    `INSERT INTO pipeline_runs (id, user_id, product_id, status, template_id, adhoc_prompt, started_at)
     VALUES (?, ?, ?, 'running', ?, ?, ?)`,
  ).run(runId, userId, productId, opts.templateId ?? null, opts.adhocPrompt ?? null, started);

  db.prepare(`UPDATE products SET status = 'processing', updated_at = ? WHERE id = ?`).run(
    started,
    productId,
  );

  const processed = await runPipeline({
    title: row.title,
    priceCny: row.price_cny,
    targetLocale: row.target_locale as TargetLocale,
    promptNote: opts.adhocPrompt,
  });

  const finished = new Date().toISOString();
  db.prepare(
    `UPDATE products SET status = 'ready', processed_json = ?, pipeline_note = ?, updated_at = ? WHERE id = ?`,
  ).run(JSON.stringify(processed), opts.adhocPrompt ?? null, finished, productId);

  db.prepare(
    `UPDATE pipeline_runs SET status = 'done', output_json = ?, finished_at = ? WHERE id = ?`,
  ).run(JSON.stringify(processed), finished, runId);

  return { runId, product: getProduct(db, userId, productId)!, processed };
}
