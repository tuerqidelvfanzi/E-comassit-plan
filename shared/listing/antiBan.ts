/**
 * 防封素材校验 — 面料负向扫描（Polyester vs Cotton）
 * 扩展规则引擎 safety 分组
 */

export type MaterialKind = 'cotton' | 'polyester' | 'blend' | 'unknown';

export type AntiBanIssue = {
  code: 'MATERIAL_MISMATCH' | 'POLYESTER_CLAIM' | 'COTTON_CLAIM' | 'BANNED_TERM';
  severity: 'error' | 'warn';
  message: string;
  field?: string;
};

export type AntiBanScanResult = {
  ok: boolean;
  detectedMaterial: MaterialKind;
  issues: AntiBanIssue[];
};

const COTTON_PATTERNS = [/棉/, /\bcotton\b/i, /纯棉/, /全棉/];
const POLYESTER_PATTERNS = [/聚酯/, /\bpolyester\b/i, /涤纶/, /化纤/];
const BLEND_PATTERNS = [/混纺/, /\bblend\b/i, /棉.*涤|涤.*棉/];

const BANNED_TERMS = [
  { pattern: /耐克|nike/i, label: 'Nike' },
  { pattern: /阿迪达斯|adidas/i, label: 'Adidas' },
  { pattern: /迪士尼|disney/i, label: 'Disney' },
  { pattern: /\blv\b|路易威登|louis vuitton/i, label: 'LV' },
  { pattern: /gucci|古驰/i, label: 'Gucci' },
  { pattern: /chanel|香奈儿/i, label: 'Chanel' },
  { pattern: /爱马仕|hermes/i, label: 'Hermès' },
  { pattern: /苹果|apple(?!\s*watch)/i, label: 'Apple' },
  { pattern: /三星|samsung/i, label: 'Samsung' },
  { pattern: /华为|huawei/i, label: 'Huawei' },
  { pattern: /\bnasa\b/i, label: 'NASA' },
  { pattern: /3[Cc]认证|产地[:：]|发货地[:：]/, label: '国内标识' },
  { pattern: /最便宜|全网最低|绝对|100%正品|国家级|世界级|最佳/i, label: '虚假宣传' },
];

export function detectMaterial(text: string): MaterialKind {
  const t = text.trim();
  if (!t) return 'unknown';
  if (BLEND_PATTERNS.some((p) => p.test(t))) return 'blend';
  const hasCotton = COTTON_PATTERNS.some((p) => p.test(t));
  const hasPoly = POLYESTER_PATTERNS.some((p) => p.test(t));
  if (hasCotton && hasPoly) return 'blend';
  if (hasCotton) return 'cotton';
  if (hasPoly) return 'polyester';
  return 'unknown';
}

export function scanBannedTerms(text: string): AntiBanIssue[] {
  const issues: AntiBanIssue[] = [];
  for (const { pattern, label } of BANNED_TERMS) {
    if (pattern.test(text)) {
      issues.push({
        code: 'BANNED_TERM',
        severity: 'error',
        message: `命中违禁词/品牌：${label}`,
      });
    }
  }
  return issues;
}

/**
 * 负向扫描：源站与上架文案面料一致性 + TikTok 防封策略
 * - 源站 Cotton → 上架不得写 Polyester（反之亦然）
 * - White Hook / 涤纶款：允许 Polyester，但禁止 Cotton 宣称
 */
export function scanAntiBan(
  sourceText: string,
  listingText: string,
  options?: { allowPolyesterListing?: boolean; field?: string },
): AntiBanScanResult {
  const sourceMat = detectMaterial(sourceText);
  const listingMat = detectMaterial(listingText);
  const issues: AntiBanIssue[] = [...scanBannedTerms(listingText)];

  if (sourceMat !== 'unknown' && listingMat !== 'unknown' && sourceMat !== listingMat) {
    if (sourceMat === 'cotton' && listingMat === 'polyester') {
      issues.push({
        code: 'MATERIAL_MISMATCH',
        severity: 'error',
        message: '源站为棉质，上架文案不得宣称聚酯/涤纶（防封）',
        field: options?.field,
      });
    } else if (sourceMat === 'polyester' && listingMat === 'cotton') {
      issues.push({
        code: 'MATERIAL_MISMATCH',
        severity: 'error',
        message: '源站为聚酯/涤纶，上架文案不得宣称纯棉（防封）',
        field: options?.field,
      });
    }
  }

  if (options?.allowPolyesterListing && listingMat === 'cotton') {
    issues.push({
      code: 'COTTON_CLAIM',
      severity: 'error',
      message: 'White Hook/涤纶款禁止 Cotton 宣称',
      field: options?.field,
    });
  }

  if (listingMat === 'polyester' && !options?.allowPolyesterListing && sourceMat === 'cotton') {
    issues.push({
      code: 'POLYESTER_CLAIM',
      severity: 'warn',
      message: '上架含聚酯宣称，请确认与源站棉质一致',
      field: options?.field,
    });
  }

  const errors = issues.filter((i) => i.severity === 'error');
  return {
    ok: errors.length === 0,
    detectedMaterial: listingMat,
    issues,
  };
}

export function validateMaterialConsistency(
  sourceAttributes: Record<string, unknown>,
  listingDescription: string,
  options?: { allowPolyesterListing?: boolean },
): AntiBanScanResult {
  const sourceText = [
    sourceAttributes.material,
    sourceAttributes.fabric,
    sourceAttributes['材质'],
    sourceAttributes['面料'],
    sourceAttributes.title,
  ]
    .filter(Boolean)
    .join(' ');
  return scanAntiBan(sourceText, listingDescription, options);
}
