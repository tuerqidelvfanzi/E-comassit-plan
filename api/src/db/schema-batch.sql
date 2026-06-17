CREATE TABLE IF NOT EXISTS batch_collect_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  list_url TEXT NOT NULL,
  max_items INTEGER NOT NULL DEFAULT 10,
  delay_ms_min INTEGER NOT NULL DEFAULT 250,
  delay_ms_max INTEGER NOT NULL DEFAULT 2400,
  use_cookies INTEGER NOT NULL DEFAULT 0,
  require_confirm INTEGER NOT NULL DEFAULT 1,
  items_done INTEGER NOT NULL DEFAULT 0,
  items_failed INTEGER NOT NULL DEFAULT 0,
  results_json TEXT NOT NULL DEFAULT '[]',
  audit_log_json TEXT NOT NULL DEFAULT '[]',
  error TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS user_cookie_jars (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  cookies_json TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, domain)
);
