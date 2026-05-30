import type Database from 'better-sqlite3';
import { uid } from '../lib/response.js';

export type BatchJobStatus = 'queued' | 'running' | 'done' | 'failed' | 'paused';

export type BatchCollectJob = {
  id: string;
  user_id: string;
  status: BatchJobStatus;
  list_url: string;
  max_items: number;
  delay_ms_min: number;
  delay_ms_max: number;
  use_cookies: number;
  require_confirm: number;
  items_done: number;
  items_failed: number;
  results_json: string;
  audit_log_json: string;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type BatchJobConfig = {
  listUrl: string;
  maxItems?: number;
  delayMsMin?: number;
  delayMsMax?: number;
  useCookies?: boolean;
  requireUserConfirm?: boolean;
};

export function createBatchJob(db: Database.Database, userId: string, config: BatchJobConfig) {
  const id = uid('batch');
  const now = new Date().toISOString();
  const maxItems = Math.min(Math.max(config.maxItems ?? 10, 1), 20);
  db.prepare(
    `INSERT INTO batch_collect_jobs (
      id, user_id, status, list_url, max_items, delay_ms_min, delay_ms_max,
      use_cookies, require_confirm, created_at
    ) VALUES (?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    userId,
    config.listUrl,
    maxItems,
    config.delayMsMin ?? 250,
    config.delayMsMax ?? 2400,
    config.useCookies ? 1 : 0,
    config.requireUserConfirm !== false ? 1 : 0,
    now,
  );
  return getBatchJob(db, userId, id)!;
}

export function getBatchJob(db: Database.Database, userId: string, id: string) {
  return db
    .prepare('SELECT * FROM batch_collect_jobs WHERE id = ? AND user_id = ?')
    .get(id, userId) as BatchCollectJob | undefined;
}

export function listBatchJobs(db: Database.Database, userId: string) {
  return db
    .prepare('SELECT * FROM batch_collect_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(userId) as BatchCollectJob[];
}

export function appendAudit(
  db: Database.Database,
  jobId: string,
  entry: Record<string, unknown>,
) {
  const row = db.prepare('SELECT audit_log_json FROM batch_collect_jobs WHERE id = ?').get(jobId) as
    | { audit_log_json: string }
    | undefined;
  const log = row ? (JSON.parse(row.audit_log_json) as Record<string, unknown>[]) : [];
  log.push({ ...entry, at: new Date().toISOString() });
  db.prepare('UPDATE batch_collect_jobs SET audit_log_json = ? WHERE id = ?').run(
    JSON.stringify(log),
    jobId,
  );
}

export function updateBatchStatus(
  db: Database.Database,
  jobId: string,
  patch: Partial<{
    status: BatchJobStatus;
    items_done: number;
    items_failed: number;
    results_json: string;
    error: string | null;
    started_at: string;
    finished_at: string;
  }>,
) {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (fields.length === 0) return;
  values.push(jobId);
  db.prepare(`UPDATE batch_collect_jobs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function batchJobToApi(row: BatchCollectJob) {
  return {
    id: row.id,
    status: row.status,
    listUrl: row.list_url,
    maxItems: row.max_items,
    delayMsMin: row.delay_ms_min,
    delayMsMax: row.delay_ms_max,
    useCookies: row.use_cookies === 1,
    itemsDone: row.items_done,
    itemsFailed: row.items_failed,
    results: JSON.parse(row.results_json || '[]'),
    auditLog: JSON.parse(row.audit_log_json || '[]'),
    error: row.error,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}
