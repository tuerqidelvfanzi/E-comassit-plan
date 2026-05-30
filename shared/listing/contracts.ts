/**
 * Phase 2 集成契约类型（Redis 链抓取、ADS Power、AI 图片、计费）
 * @see docs/LISTING_PUBLISH_IMPLEMENTATION.md §6–7
 */

/** Redis link catcher — 手机短链 → PC 同步 */
export type LinkCatcherEntry = {
  id: string;
  url: string;
  token: string;
  ts: number;
  source?: 'mobile_share' | 'qr_scan';
  meta?: Record<string, string>;
};

export type LinkCatcherEnqueueRequest = {
  url: string;
  token: string;
  meta?: Record<string, string>;
};

export type LinkCatcherPollResponse = {
  entry: LinkCatcherEntry | null;
  polledAt: number;
};

/** ADS Power 指纹浏览器 gate */
export type AdsPowerProfile = {
  profileId: string;
  name: string;
  status: 'active' | 'inactive';
};

export type AdsPowerGateResult = {
  available: boolean;
  baseUrl: string;
  profiles: AdsPowerProfile[];
  reason?: string;
};

export const ADS_POWER_DEFAULT_BASE = 'http://local.adspower.net:50325';

export function evaluateAdsPowerGate(
  pingOk: boolean,
  profiles: AdsPowerProfile[] = [],
  baseUrl = ADS_POWER_DEFAULT_BASE,
): AdsPowerGateResult {
  if (!pingOk) {
    return {
      available: false,
      baseUrl,
      profiles: [],
      reason: 'ADS_POWER_UNREACHABLE',
    };
  }
  const active = profiles.filter((p) => p.status === 'active');
  if (active.length === 0) {
    return {
      available: false,
      baseUrl,
      profiles,
      reason: 'NO_ACTIVE_PROFILE',
    };
  }
  return { available: true, baseUrl, profiles: active };
}

/** AI 图片 pipeline 配置 */
export type AiImageJobType = 'watermark_remove' | 'model_generate' | 'translate_overlay' | 'upscale';

/** P1 Web UI 操作名 → 内部 JobType */
export type AiImageOperation = 'dedupe_watermark' | 'upscale' | 'model_tryon';

export const AI_OPERATION_TO_JOB: Record<AiImageOperation, AiImageJobType> = {
  dedupe_watermark: 'watermark_remove',
  upscale: 'upscale',
  model_tryon: 'model_generate',
};

export function mapOperationsToJobTypes(operations: AiImageOperation[]): AiImageJobType[] {
  return operations.map((op) => AI_OPERATION_TO_JOB[op]);
}

export type AiImagePipelineConfig = {
  jobType: AiImageJobType;
  targetLocale?: string;
  outputSize: { width: number; height: number };
  provider?: 'mock' | 'replicate' | 'internal';
};

export const DEFAULT_AI_IMAGE_CONFIG: Record<AiImageJobType, AiImagePipelineConfig> = {
  watermark_remove: {
    jobType: 'watermark_remove',
    outputSize: { width: 800, height: 800 },
    provider: 'mock',
  },
  model_generate: {
    jobType: 'model_generate',
    outputSize: { width: 800, height: 800 },
    provider: 'mock',
  },
  translate_overlay: {
    jobType: 'translate_overlay',
    targetLocale: 'vi-VN',
    outputSize: { width: 800, height: 800 },
    provider: 'mock',
  },
  upscale: {
    jobType: 'upscale',
    outputSize: { width: 800, height: 800 },
    provider: 'mock',
  },
};

export type AiImageJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type AiImageJob = {
  id: string;
  productId: string;
  imageId: string;
  config: AiImagePipelineConfig;
  status: AiImageJobStatus;
  outputUrl?: string;
  error?: string;
};

/** LLM / AI 计费挂钩 */
export type BillingUnit = 'token' | 'image' | 'request';

export type BillingHook = {
  userId: string;
  operation: string;
  units: number;
  unitType: BillingUnit;
  modelUsed?: string;
  costCny?: number;
  metadata?: Record<string, unknown>;
};

export function estimateTokenCost(tokens: number, costPer1kTokens = 0.002): number {
  return Math.round((tokens / 1000) * costPer1kTokens * 10000) / 10000;
}
