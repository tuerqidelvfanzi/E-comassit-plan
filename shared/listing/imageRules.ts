/**
 * 图片处理规则（BRD v1.1 §3.4、§8.1）
 */

export const SHOPEE_VN_IMAGE_COUNT = 9;
export const TIKTOK_TH_MAIN_IMAGE_MIN = 5;
export const IMAGE_SQUARE_SIZE = 800;

/** 需保留的图片类型 */
export const KEEP_IMAGE_TYPES = [
  'appearance',
  'specs',
  'install_steps',
  'dimensions',
  'usage_scene',
] as const;

/** 需删除/消除的敏感内容关键词 */
export const SENSITIVE_IMAGE_KEYWORDS = [
  '终身质保',
  '免费退货',
  '包邮',
  '免费开票',
  '厂家介绍',
  '关于我们',
  '证书资质',
  '运输售后',
  '品牌标识',
  'LOGO',
  '水印',
] as const;

export type ProductImageStatus = 'pending' | 'downloaded' | 'processed' | 'translated';

export type ImagePipelineStage =
  | 'select'
  | 'resize_1x1'
  | 'watermark_remove'
  | 'translate'
  | 'manual_review'
  | 'done';

export type ImageRuleIssue = {
  code: 'TOO_FEW_IMAGES' | 'SENSITIVE_CONTENT' | 'WRONG_ASPECT';
  severity: 'error' | 'warn';
  message: string;
};

export function scanSensitiveContent(text: string): string[] {
  const hits: string[] = [];
  for (const kw of SENSITIVE_IMAGE_KEYWORDS) {
    if (text.includes(kw)) hits.push(kw);
  }
  return hits;
}

export function validateImageSet(
  imageCount: number,
  platform: 'shopee-vn' | 'tiktok-th',
): { ok: boolean; issues: ImageRuleIssue[] } {
  const issues: ImageRuleIssue[] = [];
  const min =
    platform === 'shopee-vn' ? SHOPEE_VN_IMAGE_COUNT : TIKTOK_TH_MAIN_IMAGE_MIN;

  if (imageCount < min) {
    issues.push({
      code: 'TOO_FEW_IMAGES',
      severity: 'error',
      message: `需要至少 ${min} 张图片，当前 ${imageCount} 张`,
    });
  }

  const errors = issues.filter((i) => i.severity === 'error');
  return { ok: errors.length === 0, issues };
}
