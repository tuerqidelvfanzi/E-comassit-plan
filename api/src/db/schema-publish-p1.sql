-- P1: publish fill payload + AI image jobs

ALTER TABLE publish_tasks ADD COLUMN fill_payload_json TEXT;
ALTER TABLE publish_tasks ADD COLUMN validation_json TEXT;
ALTER TABLE publish_tasks ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS image_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  operations_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER NOT NULL DEFAULT 0,
  result_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_image_jobs_product ON image_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_publish_tasks_user_status ON publish_tasks(user_id, status);
