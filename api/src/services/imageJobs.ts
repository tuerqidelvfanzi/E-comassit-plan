import type Database from 'better-sqlite3';
import { uid } from '../lib/response.js';
import {
  DEFAULT_AI_IMAGE_CONFIG,
  mapOperationsToJobTypes,
  type AiImageJobStatus,
  type AiImageOperation,
} from '../domain/listing.js';
import { getProduct } from './products.js';

export type ImageJobRow = {
  id: string;
  user_id: string;
  product_id: string;
  operations_json: string;
  status: string;
  progress: number;
  result_json: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type ImageJobApi = {
  id: string;
  productId: string;
  operations: AiImageOperation[];
  status: AiImageJobStatus;
  progress: number;
  resultUrls?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

function rowToApi(row: ImageJobRow): ImageJobApi {
  const result = row.result_json ? (JSON.parse(row.result_json) as { urls?: string[] }) : undefined;
  return {
    id: row.id,
    productId: row.product_id,
    operations: JSON.parse(row.operations_json) as AiImageOperation[],
    status: row.status as AiImageJobStatus,
    progress: row.progress,
    resultUrls: result?.urls,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function simulateProcessedUrls(productId: string, operations: AiImageOperation[]): string[] {
  const suffix = operations.join('-');
  return [
    `https://placehold.co/800x800/e2e8f0/64748b?text=${encodeURIComponent(`${productId}-${suffix}-1`)}`,
    `https://placehold.co/800x800/e2e8f0/64748b?text=${encodeURIComponent(`${productId}-${suffix}-2`)}`,
  ];
}

export function createImageJob(
  db: Database.Database,
  userId: string,
  productId: string,
  operations: AiImageOperation[],
): ImageJobApi | null {
  const product = getProduct(db, userId, productId);
  if (!product) return null;

  const id = uid('imgjob');
  const now = new Date().toISOString();
  const jobTypes = mapOperationsToJobTypes(operations);

  db.prepare(
    `INSERT INTO image_jobs (id, user_id, product_id, operations_json, status, progress, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'queued', 0, ?, ?)`,
  ).run(id, userId, productId, JSON.stringify(operations), now, now);

  const resultUrls = simulateProcessedUrls(productId, operations);
  const configs = jobTypes.map((t) => DEFAULT_AI_IMAGE_CONFIG[t]);

  db.prepare(
    `UPDATE image_jobs SET status = 'running', progress = 30, updated_at = ? WHERE id = ?`,
  ).run(now, id);

  const finished = new Date().toISOString();
  db.prepare(
    `UPDATE image_jobs SET status = 'completed', progress = 100,
      result_json = ?, updated_at = ? WHERE id = ?`,
  ).run(JSON.stringify({ urls: resultUrls, configs, provider: 'mock' }), finished, id);

  const images = [...(product.images ?? []), ...resultUrls];
  db.prepare(`UPDATE products SET images_json = ?, updated_at = ? WHERE id = ? AND user_id = ?`).run(
    JSON.stringify(images),
    finished,
    productId,
    userId,
  );

  const row = db.prepare('SELECT * FROM image_jobs WHERE id = ?').get(id) as ImageJobRow;
  return rowToApi(row);
}

export function listImageJobs(db: Database.Database, userId: string, productId: string) {
  const rows = db
    .prepare(
      'SELECT * FROM image_jobs WHERE user_id = ? AND product_id = ? ORDER BY created_at DESC LIMIT 20',
    )
    .all(userId, productId) as ImageJobRow[];
  return rows.map(rowToApi);
}

export function getImageJob(db: Database.Database, userId: string, jobId: string) {
  const row = db
    .prepare('SELECT * FROM image_jobs WHERE id = ? AND user_id = ?')
    .get(jobId, userId) as ImageJobRow | undefined;
  return row ? rowToApi(row) : null;
}
