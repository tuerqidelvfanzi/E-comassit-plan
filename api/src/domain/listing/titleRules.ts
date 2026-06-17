/**
 * 标题规则（BRD v1.1 §3.2 越南 Shopee ≤20 字符）
 */

export type TitleValidationIssue = {
  code: 'TITLE_TOO_LONG' | 'CJK_TOO_MANY';
  severity: 'error' | 'warn';
  message: string;
  charCount: number;
  limit: number;
};

export type TitleValidationResult = {
  ok: boolean;
  charCount: number;
  cjkCount: number;
  issues: TitleValidationIssue[];
};

/** 越南站标题上限（BRD：20 字符；汉字宜压缩到 9–10 字以内） */
export const VIETNAM_TITLE_MAX = 20;
export const VIETNAM_CJK_RECOMMENDED_MAX = 10;

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/g;

export function countTitleChars(title: string): number {
  return [...title.trim()].length;
}

export function countCjkChars(title: string): number {
  return (title.match(CJK_RE) ?? []).length;
}

export function validateTitle(
  title: string,
  options?: { maxChars?: number; cjkRecommendedMax?: number },
): TitleValidationResult {
  const maxChars = options?.maxChars ?? VIETNAM_TITLE_MAX;
  const cjkRecommendedMax = options?.cjkRecommendedMax ?? VIETNAM_CJK_RECOMMENDED_MAX;
  const charCount = countTitleChars(title);
  const cjkCount = countCjkChars(title);
  const issues: TitleValidationIssue[] = [];

  if (charCount > maxChars) {
    issues.push({
      code: 'TITLE_TOO_LONG',
      severity: 'error',
      message: `标题 ${charCount} 字符，超出 ${maxChars} 字符限制`,
      charCount,
      limit: maxChars,
    });
  }

  if (cjkCount > cjkRecommendedMax) {
    issues.push({
      code: 'CJK_TOO_MANY',
      severity: 'warn',
      message: `标题含 ${cjkCount} 个汉字，建议压缩到 ${cjkRecommendedMax} 字以内`,
      charCount,
      limit: cjkRecommendedMax,
    });
  }

  const errors = issues.filter((i) => i.severity === 'error');
  return { ok: errors.length === 0, charCount, cjkCount, issues };
}

/** 简易截断：保留前 maxChars 个 Unicode 字符 */
export function truncateTitle(title: string, maxChars = VIETNAM_TITLE_MAX): string {
  const chars = [...title.trim()];
  return chars.slice(0, maxChars).join('');
}
