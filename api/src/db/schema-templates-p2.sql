-- P2: 类目模板 SKU 配置持久化
ALTER TABLE category_templates ADD COLUMN sku_config_json TEXT;
ALTER TABLE category_templates ADD COLUMN category_id TEXT;
