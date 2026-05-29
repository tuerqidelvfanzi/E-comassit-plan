import type Database from 'better-sqlite3';
import { runPipeline, type TargetLocale } from '../domain/pipeline.js';
import { uid } from '../lib/response.js';

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
};

export function rowToApi(row: ProductRow) {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    sourceUrl: row.source_url,
    priceCny: row.price_cny,
    status: row.status,
    category: row.category,
    thumb: row.thumb,
    targetLocale: row.target_locale as TargetLocale,
    capturedAt: row.captured_at,
    fromExtension: row.from_extension === 1,
    extractLayer: row.extract_layer ?? undefined,
    extractMethod: row.extract_method ?? undefined,
    images: JSON.parse(row.images_json || '[]') as string[],
    skus: JSON.parse(row.skus_json || '[]'),
    attributes: JSON.parse(row.attributes_json || '{}') as Record<string, unknown>,
    rawCapture: row.raw_capture_json ? JSON.parse(row.raw_capture_json) : undefined,
    processed: row.processed_json ? JSON.parse(row.processed_json) : undefined,
    pipelineNote: row.pipeline_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProducts(db: Database.Database, userId: string, status?: string) {
  let sql = 'SELECT * FROM products WHERE user_id = ?';
  const params: string[] = [userId];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
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
  const thumb =
    (images[0] as string) ||
    `https://placehold.co/80x80/073642/93a1a1?text=${encodeURIComponent(String(payload.source ?? 'NEW').slice(0, 4))}`;

  db.prepare(
    `INSERT INTO products (
      id, user_id, title, source, source_url, price_cny, status, category, thumb,
      target_locale, captured_at, from_extension, extract_layer, extract_method,
      images_json, skus_json, attributes_json, raw_capture_json, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
    JSON.stringify(payload.skus ?? []),
    JSON.stringify(payload.attributes ?? {}),
    JSON.stringify(payload),
    now,
    now,
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
