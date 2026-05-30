/**
 * 各演示类目 × 目标市场的 SKU 编码建议（悬停 Tips）
 * 实际生产应由店铺/品类规则引擎配置，此处仅作演示引导。
 */
import type { CategoryTemplateId, TargetLocale } from './api/types';

export type SkuEncodingHint = {
  format: string;
  example: string;
  notes: string[];
};

const MARKET_LABEL: Record<TargetLocale, string> = {
  'vi-VN': '越南 Shopee',
  'th-TH': '泰国 TikTok',
  'id-ID': '印尼 Shopee',
  'fil-PH': '菲律宾 Shopee',
};

/** 按类目 + 市场返回编码建议 */
export function getSkuEncodingHint(
  categoryId: CategoryTemplateId | undefined,
  market: TargetLocale = 'vi-VN',
): SkuEncodingHint {
  const marketName = MARKET_LABEL[market];

  switch (categoryId) {
    case 'tpl-clothing-tshirt':
      return {
        format: '{店铺}-{序号4}-{P|R|PR}-{颜色2}-{尺码}',
        example: 'BF-0001-PR-WH-S',
        notes: [
          `${marketName}：服装-T恤 采用五段主码（PRD v2.0）`,
          'P=正面图案，R=背面，PR=正反面；颜色 WH/BK/PK 等',
          '单款式占位：BF-9999-P-WH-{尺码}（Hook 价400/库存5）',
          '印花款 v2.1 用商品属性记录，不 lengthen 主 SKU 码',
          '越南：售价×3.5、库存50；泰国：×2.5、主图≥5张',
        ],
      };
    case 'tpl-clothing-general':
      return {
        format: '{店铺}-{品类码}-{序号}-{颜色}-{尺码}',
        example: 'BF-CL-012-WH-L',
        notes: [
          `${marketName}：通用服装可用简化四段+品类码 CL`,
          '多店铺时 PREFIX 区分经营者（如 BF / YT / ZK）',
          '无印花需求可省略 +B/+H 后缀',
        ],
      };
    case 'tpl-kitchenware':
      return {
        format: '{店铺}-KT-{序号}-{规格}',
        example: 'BF-KT-0042-24CM',
        notes: [
          `${marketName}：厨具按规格命名，不用服装正反面段`,
          '规格段写容量/直径（24CM、500ML）',
          '菲律宾站常配合固定价 500 PHP',
        ],
      };
    case 'tpl-lighting':
      return {
        format: '{店铺}-LT-{序号}-{瓦数}W-{色温}K',
        example: 'BF-LT-0088-12W-4000K',
        notes: [
          `${marketName}：灯具用瓦数+色温区分 SKU`,
          '避免使用品牌灯具型号，防侵权',
        ],
      };
    case 'tpl-beauty':
      return {
        format: '{店铺}-BT-{序号}-{容量}',
        example: 'BF-BT-0150-50ML',
        notes: [
          `${marketName}：美妆按容量/色号（50ML、#02）`,
          '标题与图需删 3C/产地/品牌宣称',
        ],
      };
    case 'tpl-electronics':
      return {
        format: '{店铺}-3C-{型号简码}-{颜色}',
        example: 'BF-3C-A1-BK',
        notes: [
          `${marketName}：3C 用型号简码+颜色，勿写 Apple/Samsung 等`,
          '印尼/越南注意插头规格在属性里标注',
        ],
      };
    case 'tpl-home':
      return {
        format: '{店铺}-HM-{序号}-{变体}',
        example: 'BF-HM-0201-SET2',
        notes: [
          `${marketName}：家居套装用 SET2/SET4 等变体段`,
          '重量默认 220g，包裹常 10×5×10 cm',
        ],
      };
    default:
      return {
        format: '{店铺}-{序号}-{变体描述}',
        example: 'BF-0001-V1',
        notes: [
          `${marketName}：通用模板 — 在「类目模板」页配置 PREFIX/颜色/尺码`,
          '不同国家可建多套模板（语言字段区分 vi/th/id/fil）',
          '后续可接规则引擎：按店铺 ID 加载编码脚本',
        ],
      };
  }
}

export function marketFromTemplateLanguage(language: string): TargetLocale {
  if (language.includes('泰')) return 'th-TH';
  if (language.includes('印尼')) return 'id-ID';
  if (language.includes('菲律宾')) return 'fil-PH';
  return 'vi-VN';
}
