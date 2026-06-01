/**
 * 违禁词检测模块
 * V3需求: FR-RW-06 违禁词检测
 */

// 品牌词库
export const BRAND_WORDS = [
  'Nike', 'Adidas', 'Disney', 'LV', 'Gucci', 'Chanel', 'Hermès', '爱马仕',
  'Apple', 'Samsung', '华为', 'HUAWEI', 'NASA', 'Puma', 'Reebok', 'Newbalance',
  'Jordan', 'Supreme', 'Off-White', 'Balenciaga', 'Prada', 'Versace', 'Fendi',
  '小米', 'MI', '红米', 'OPPO', 'VIVO', '一加', 'realme',
  '耐克', '阿迪达斯', '迪士尼', '苹果', '三星'
];

// 国内标识词库
export const DOMESTIC_FLAGS = [
  '全国包邮', '包邮', '免运费', '3C认证', 'CCC', '发货地',
  'Made in China', '中国制造', '中国产', '全网最低', '全网最便宜',
  '100%正品', '正品保证', '官方正品', '天猫正品', '淘宝正品',
  '七天无理由', '退货包运费', '终身质保', '永久保修'
];

// 虚假宣传词库
export const EXAGGERATED_WORDS = [
  '最好', '第一', '顶级', '顶级', '极品', '神级',
  '全球最好', '世界最好', '全网最好', '全网第一',
  '绝对', '保证', '100%', '纯天然', '纯手工',
  '速效', '立即', '马上', '立竿见影',
  '最好用', '最有效', '最强', '最佳'
];

// 宗教禁忌词库（印尼市场）
export const RELIGION_WORDS = [
  '猪肉', '猪皮', '猪油', '清真', 'HALAL', 'halal',
  '穆斯林', '伊斯兰', '基督教', '佛教', '佛像', '菩萨'
];

// 面料一致性检测词
export const FABRIC_WORDS = [
  '棉', '纯棉', '全棉', '涤纶', '聚酯纤维', '尼龙', '氨纶',
  '丝绸', '真丝', '羊毛', '羊绒', '貂毛', '狐狸毛',
  '皮革', 'PU皮', '牛皮', '羊皮'
];

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'brand' | 'domestic' | 'exaggerated' | 'religion' | 'fabric';
  word: string;
  position: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: string;
  message: string;
  suggestion?: string;
}

/**
 * 文本检测
 */
export function checkText(text: string, locale: string = 'vi-VN'): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const lowerText = text.toLowerCase();

  // 品牌词检测
  for (const brand of BRAND_WORDS) {
    const index = lowerText.indexOf(brand.toLowerCase());
    if (index !== -1) {
      errors.push({
        type: 'brand',
        word: brand,
        position: index,
        message: `检测到品牌词 "${brand}"，东南亚市场禁止使用`,
        severity: 'error'
      });
    }
  }

  // 国内标识检测
  for (const flag of DOMESTIC_FLAGS) {
    const index = lowerText.indexOf(flag.toLowerCase());
    if (index !== -1) {
      errors.push({
        type: 'domestic',
        word: flag,
        position: index,
        message: `检测到国内标识 "${flag}"，可能被越南平台下架`,
        severity: 'error'
      });
    }
  }

  // 虚假宣传检测
  for (const word of EXAGGERATED_WORDS) {
    const index = lowerText.indexOf(word.toLowerCase());
    if (index !== -1) {
      errors.push({
        type: 'exaggerated',
        word: word,
        position: index,
        message: `检测到虚假宣传词 "${word}"，违反广告法`,
        severity: 'error'
      });
    }
  }

  // 宗教禁忌（印尼市场）
  if (locale === 'id-ID') {
    for (const word of RELIGION_WORDS) {
      const index = lowerText.indexOf(word.toLowerCase());
      if (index !== -1) {
        errors.push({
          type: 'religion',
          word: word,
          position: index,
          message: `检测到宗教敏感词 "${word}"，印尼市场禁止`,
          severity: 'error'
        });
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 面料一致性检测
 * 标题含棉 → 属性必须含棉
 */
export function checkFabricConsistency(
  title: string,
  attributes: Record<string, string>
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const titleFabric = FABRIC_WORDS.filter(f => title.includes(f));
  
  if (titleFabric.length > 0) {
    const attrValues = Object.values(attributes).join('').toLowerCase();
    const missingFabrics = titleFabric.filter(f => !attrValues.includes(f));
    
    if (missingFabrics.length > 0) {
      warnings.push({
        type: 'fabric',
        message: `标题中提到"${missingFabrics.join('、')}"，但属性中未找到对应面料`,
        suggestion: '请在属性中添加对应面料描述'
      });
    }
  }
  
  return warnings;
}

/**
 * 越南平台标题验证
 */
export function validateVietnamTitle(title: string): ValidationResult {
  const result = checkText(title, 'vi-VN');
  
  // 越南标题特殊规则
  const charCount = countVietnameseChars(title);
  if (charCount > 20) {
    result.errors.push({
      type: 'domestic',
      word: '',
      position: 0,
      message: `越南标题不能超过20个字符，当前${charCount}个字符`,
      severity: 'error'
    });
    result.passed = false;
  }
  
  return result;
}

/**
 * 计算越南语字符数（精确）
 */
export function countVietnameseChars(text: string): number {
  // 使用Array.from正确处理Unicode字符（包括越南语变音符号）
  return Array.from(text).filter(char => !/\s/.test(char)).length;
}

/**
 * 替换违禁词为占位符
 */
export function replaceBannedWords(text: string): string {
  let result = text;
  
  for (const brand of BRAND_WORDS) {
    const regex = new RegExp(brand, 'gi');
    result = result.replace(regex, '[品牌]');
  }
  
  return result;
}
