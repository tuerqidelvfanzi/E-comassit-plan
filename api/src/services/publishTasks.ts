import type Database from 'better-sqlite3';
import {
  calcListPrice,
  encodeDummyHookSku,
  encodeSku,
  getDefaultStock,
  getDefaultWeightGrams,
  LOGISTICS_DEFAULTS,
  NO_BRAND,
  validateMaterialConsistency,
  validateTitle,
  type TargetMarket,
} from '../domain/listing.js';
import { getProduct } from './products.js';

export type FillPayload = {
  platform: 'tiktok' | 'taobao' | 'shopee';
  title: string;
  price: number;
  currency: string;
  stock: number;
  weightGrams: number;
  brand: string;
  skus: Array<{
    skuCode: string;
    color: string;
    size: string;
    price: number;
    stock: number;
    weight?: number;
    isDummyHook?: boolean;
  }>;
  logistics: typeof LOGISTICS_DEFAULTS;
};

export type PrepareValidation = {
  ok: boolean;
  antiBan: ReturnType<typeof validateMaterialConsistency>;
  title?: ReturnType<typeof validateTitle>;
  issues: string[];
};

function platformToKey(platform: string): FillPayload['platform'] {
  if (platform === 'TikTok Shop') return 'tiktok';
  if (platform === '淘宝') return 'taobao';
  return 'shopee';
}

function resolveMarket(platform: string, locale: string): TargetMarket {
  if (platform === 'TikTok Shop') return 'th-tiktok';
  if (locale === 'fil-PH') return 'ph-shopee';
  if (locale === 'id-ID') return 'id-shopee';
  return 'vn-shopee';
}

function currencyForMarket(market: TargetMarket): string {
  if (market === 'th-tiktok') return 'THB';
  if (market === 'ph-shopee') return 'PHP';
  if (market === 'id-shopee') return 'IDR';
  return 'VND';
}

export function buildFillPayload(
  platform: string,
  title: string,
  priceCny: number,
  targetLocale: string,
  attributes: Record<string, unknown>,
): { fillPayload: FillPayload; validation: PrepareValidation } {
  const market = resolveMarket(platform, targetLocale);
  const listPrice = calcListPrice(priceCny, market);
  const stock = getDefaultStock(market);
  const weightGrams = getDefaultWeightGrams(market);
  const listingText = title;

  const antiBan = validateMaterialConsistency(attributes, listingText, {
    allowPolyesterListing: platform === 'TikTok Shop',
  });
  const titleVal =
    market === 'vn-shopee' || market === 'id-shopee' ? validateTitle(title) : undefined;

  const issues: string[] = [];
  if (!antiBan.ok) {
    issues.push(...antiBan.issues.filter((i) => i.severity === 'error').map((i) => i.message));
  }
  if (titleVal && !titleVal.ok) {
    issues.push(...titleVal.issues.filter((i) => i.severity === 'error').map((i) => i.message));
  }

  const skus = [
    {
      skuCode: encodeDummyHookSku('BF', 'M'),
      color: 'empty',
      size: 'M',
      price: platform === 'TikTok Shop' ? 400 : listPrice,
      stock: platform === 'TikTok Shop' ? 5 : stock,
      weight: weightGrams,
      isDummyHook: true,
    },
  ];

  try {
    skus.unshift({
      skuCode: encodeSku({ sequence: 1, side: 'PR', color: 'WH', size: 'M' }),
      color: '白色',
      size: 'M',
      price: listPrice,
      stock,
      weight: weightGrams,
      isDummyHook: false,
    });
  } catch {
    /* keep dummy hook only */
  }

  const fillPayload: FillPayload = {
    platform: platformToKey(platform),
    title,
    price: listPrice,
    currency: currencyForMarket(market),
    stock,
    weightGrams,
    brand: NO_BRAND,
    skus,
    logistics: LOGISTICS_DEFAULTS,
  };

  return {
    fillPayload,
    validation: {
      ok: issues.length === 0,
      antiBan,
      title: titleVal,
      issues,
    },
  };
}

export function getPublishTask(db: Database.Database, userId: string, id: string) {
  const row = db
    .prepare('SELECT * FROM publish_tasks WHERE id = ? AND user_id = ?')
    .get(id, userId) as
    | {
        id: string;
        platform: string;
        title: string;
        status: string;
        reason: string | null;
        product_id: string | null;
        fill_payload_json: string | null;
        validation_json: string | null;
        retry_count: number;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    platform: row.platform,
    title: row.title,
    status: row.status,
    reason: row.reason ?? undefined,
    productId: row.product_id ?? undefined,
    fillPayload: row.fill_payload_json ? JSON.parse(row.fill_payload_json) : undefined,
    validation: row.validation_json ? JSON.parse(row.validation_json) : undefined,
    retryCount: row.retry_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function preparePublishTask(db: Database.Database, userId: string, taskId: string) {
  const task = getPublishTask(db, userId, taskId);
  if (!task) return null;

  let title = task.title;
  let priceCny = 0;
  let attributes: Record<string, unknown> = {};
  let targetLocale = 'vi-VN';

  if (task.productId) {
    const product = getProduct(db, userId, task.productId);
    if (product) {
      title = product.processed?.conversion?.title ?? product.title;
      priceCny = product.priceCny;
      attributes = product.attributes ?? {};
      targetLocale = product.targetLocale;
    }
  }

  const { fillPayload, validation } = buildFillPayload(
    task.platform,
    title,
    priceCny,
    targetLocale,
    attributes,
  );

  const now = new Date().toISOString();
  const nextStatus = validation.ok ? 'pending' : task.status;

  db.prepare(
    `UPDATE publish_tasks SET
      fill_payload_json = ?,
      validation_json = ?,
      status = ?,
      reason = ?,
      updated_at = ?
     WHERE id = ? AND user_id = ?`,
  ).run(
    JSON.stringify(fillPayload),
    JSON.stringify(validation),
    nextStatus,
    validation.ok ? null : validation.issues.join('; '),
    now,
    taskId,
    userId,
  );

  return {
    taskId,
    ok: validation.ok,
    validation,
    fillPayload,
    fillInstructions: validation.ok
      ? `打开${task.platform}卖家后台新建草稿，插件填入：标题「${fillPayload.title}」· 价格 ${fillPayload.price} ${fillPayload.currency} · 库存 ${fillPayload.stock} · 重量 ${fillPayload.weightGrams}g · 品牌 ${fillPayload.brand}`
      : undefined,
  };
}

export function getLatestFillPayload(
  db: Database.Database,
  userId: string,
  platformKey: string,
) {
  const platformMap: Record<string, string> = {
    tiktok: 'TikTok Shop',
    taobao: '淘宝',
    shopee: 'Shopee',
  };
  const platform = platformMap[platformKey] ?? platformMap.shopee;
  const row = db
    .prepare(
      `SELECT fill_payload_json, id, title FROM publish_tasks
       WHERE user_id = ? AND platform = ? AND fill_payload_json IS NOT NULL
       ORDER BY updated_at DESC LIMIT 1`,
    )
    .get(userId, platform) as { fill_payload_json: string; id: string; title: string } | undefined;
  if (!row?.fill_payload_json) return null;
  return {
    taskId: row.id,
    title: row.title,
    fillPayload: JSON.parse(row.fill_payload_json) as FillPayload,
  };
}
