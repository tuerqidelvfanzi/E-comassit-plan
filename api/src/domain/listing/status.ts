/**
 * 上架/发布状态机（BRD §5.4、§8）
 * @see docs/LISTING_PUBLISH_IMPLEMENTATION.md
 */

/** 平台侧商品生命周期（BRD 扩展状态） */
export const ListingStatus = {
  Pending: 'pending',
  Draft: 'draft',
  Reviewing: 'reviewing',
  Live: 'live',
  Suspended: 'suspended',
} as const;

export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

/** 发布任务状态（插件填表队列） */
export const PublishTaskStatus = {
  Draft: 'draft',
  Pending: 'pending',
  Filling: 'filling',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const;

export type PublishTaskStatus = (typeof PublishTaskStatus)[keyof typeof PublishTaskStatus];

/** B 站采集箱内部状态（现有 API / Web，保持不变） */
export const ProductLifecycleStatus = {
  Raw: 'raw',
  Processing: 'processing',
  Ready: 'ready',
  Published: 'published',
} as const;

export type ProductLifecycleStatus =
  (typeof ProductLifecycleStatus)[keyof typeof ProductLifecycleStatus];

/** 内部状态 → 平台展示状态（BRD 映射，不替换 DB 字段） */
export const PRODUCT_TO_LISTING_STATUS: Record<ProductLifecycleStatus, ListingStatus> = {
  raw: ListingStatus.Pending,
  processing: ListingStatus.Draft,
  ready: ListingStatus.Reviewing,
  published: ListingStatus.Live,
};

export const LISTING_TO_PRODUCT_STATUS: Partial<Record<ListingStatus, ProductLifecycleStatus>> = {
  pending: ProductLifecycleStatus.Raw,
  draft: ProductLifecycleStatus.Processing,
  reviewing: ProductLifecycleStatus.Ready,
  live: ProductLifecycleStatus.Published,
};

const PUBLISH_TRANSITIONS: Record<PublishTaskStatus, PublishTaskStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['filling', 'cancelled'],
  filling: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: ['pending', 'cancelled'],
  cancelled: [],
};

export function canTransitionPublishTask(from: PublishTaskStatus, to: PublishTaskStatus): boolean {
  if (from === to) return true;
  return PUBLISH_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertPublishTransition(from: PublishTaskStatus, to: PublishTaskStatus): void {
  if (!canTransitionPublishTask(from, to)) {
    throw new Error(`INVALID_PUBLISH_TRANSITION: ${from} -> ${to}`);
  }
}

export function mapProductStatusToListing(status: ProductLifecycleStatus): ListingStatus {
  return PRODUCT_TO_LISTING_STATUS[status];
}
