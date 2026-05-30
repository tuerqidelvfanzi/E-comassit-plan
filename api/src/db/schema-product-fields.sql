-- P2: 核心数据字段补全（BRD v1.1 §5）
-- 商品表新增字段

ALTER TABLE products ADD COLUMN has_variants INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN sku_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN image_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN category_id TEXT;

-- SKU 详情表（可选，用于存储 SKU 变体信息）
CREATE TABLE IF NOT EXISTS product_skus (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  color_code TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  weight_grams INTEGER NOT NULL DEFAULT 0,
  sku_code TEXT NOT NULL DEFAULT '',
  pattern_suffix TEXT CHECK(pattern_suffix IN ('P', 'R', 'PR')),
  is_dummy_hook INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_skus_product ON product_skus(product_id);

-- 图片敏感内容表
CREATE TABLE IF NOT EXISTS product_image_sensitive (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_image_sensitive_product ON product_image_sensitive(product_id);

-- 违禁词检查记录表
CREATE TABLE IF NOT EXISTS blacklist_check_logs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  found_words_json TEXT NOT NULL DEFAULT '[]',
  checked_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blacklist_logs_product ON blacklist_check_logs(product_id);
