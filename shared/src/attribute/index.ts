/**
 * 属性改写模块
 * V3需求: FR-RW-05 属性改写
 */

/** 属性映射规则 */
export interface AttributeMapping {
  sourceAttribute: string;      // 源属性名
  targetAttributes: Record<string, string>;  // 目标平台的目标属性名映射
}

/** 标准化的属性值 */
export interface NormalizedAttribute {
  name: string;
  value: string;
  normalizedValue: string;
}

/** 属性改写配置 */
export interface AttributeRewriteConfig {
  locale: string;
  category: string;  // 服装/灯具/橱柜/美妆
  platform: string;  // shopee/tiktok
}

/** 颜色标准化映射 */
export const COLOR_NORMALIZATION: Record<string, Record<string, string>> = {
  'vi-VN': {
    '白色': 'Trắng',
    '黑色': 'Đen',
    '红色': 'Đỏ',
    '蓝色': 'Xanh dương',
    '绿色': 'Xanh lá',
    '黄色': 'Vàng',
    '粉色': 'Hồng',
    '紫色': 'Tím',
    '灰色': 'Xám',
    '橙色': 'Cam',
    '棕色': 'Nâu'
  },
  'th-TH': {
    '白色': 'สีขาว',
    '黑色': 'สีดำ',
    '红色': 'สีแดง',
    '蓝色': 'สีน้ำเงิน',
    '绿色': 'สีเขียว',
    '黄色': 'สีเหลือง',
    '粉色': 'สีชมพู',
    '紫色': 'สีม่วง',
    '灰色': 'สีเทา',
    '橙色': 'สีส้ม',
    '棕色': 'สีน้ำตาล'
  },
  'fil-PH': {
    '白色': 'White',
    '黑色': 'Black',
    '红色': 'Red',
    '蓝色': 'Blue',
    '绿色': 'Green',
    '黄色': 'Yellow',
    '粉色': 'Pink',
    '紫色': 'Purple',
    '灰色': 'Gray',
    '橙色': 'Orange',
    '棕色': 'Brown'
  },
  'id-ID': {
    '白色': 'Putih',
    '黑色': 'Hitam',
    '红色': 'Merah',
    '蓝色': 'Biru',
    '绿色': 'Hijau',
    '黄色': 'Kuning',
    '粉色': 'Merah muda',
    '紫色': 'Ungu',
    '灰色': 'Abu-abu',
    '橙色': 'Oranye',
    '棕色': 'Coklat'
  }
};

/** 尺码标准化映射 */
export const SIZE_NORMALIZATION: Record<string, Record<string, string>> = {
  'vi-VN': {
    'XS': 'XS',
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    'XXL': 'XXL',
    'XXXL': 'XXXL',
    '80': '80',
    '90': '90',
    '100': '100',
    '110': '110',
    '120': '120',
    '130': '130',
    '140': '140'
  },
  'th-TH': {
    'XS': 'XS',
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    'XXL': '2XL',
    'XXXL': '3XL',
    '80': '80',
    '90': '90',
    '100': '100',
    '110': '110',
    '120': '120',
    '130': '130',
    '140': '140'
  },
  'fil-PH': {
    'XS': 'XS',
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    'XXL': 'XXL',
    'XXXL': 'XXXL'
  },
  'id-ID': {
    'XS': 'XS',
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    'XXL': 'XXL',
    'XXXL': 'XXXL'
  }
};

/** 面料属性映射 */
export const FABRIC_MAPPING: Record<string, string> = {
  '纯棉': 'Cotton 100%',
  '全棉': 'Cotton 100%',
  '棉质': 'Cotton',
  '涤纶': 'Polyester',
  '聚酯纤维': 'Polyester',
  '尼龙': 'Nylon',
  '氨纶': 'Spandex',
  '丝绸': 'Silk',
  '真丝': 'Silk',
  '羊毛': 'Wool',
  '羊绒': 'Cashmere'
};

/**
 * 标准化颜色值
 */
export function normalizeColor(color: string, locale: string): string {
  const colorMap = COLOR_NORMALIZATION[locale];
  if (!colorMap) return color;
  return colorMap[color] || color;
}

/**
 * 标准化尺码值
 */
export function normalizeSize(size: string, locale: string): string {
  const sizeMap = SIZE_NORMALIZATION[locale];
  if (!sizeMap) return size;
  return sizeMap[size.toUpperCase()] || size;
}

/**
 * 标准化面料值
 */
export function normalizeFabric(fabric: string): string {
  for (const [key, value] of Object.entries(FABRIC_MAPPING)) {
    if (fabric.includes(key)) {
      return value;
    }
  }
  return fabric;
}

/**
 * 改写属性列表
 */
export function rewriteAttributes(
  attributes: Record<string, string>,
  config: AttributeRewriteConfig
): Record<string, NormalizedAttribute> {
  const result: Record<string, NormalizedAttribute> = {};
  
  for (const [key, value] of Object.entries(attributes)) {
    let normalizedValue = value;
    
    // 颜色标准化
    if (key.toLowerCase().includes('color') || key.includes('颜色')) {
      normalizedValue = normalizeColor(value, config.locale);
    }
    
    // 尺码标准化
    if (key.toLowerCase().includes('size') || key.includes('尺码')) {
      normalizedValue = normalizeSize(value, config.locale);
    }
    
    // 面料标准化
    if (key.toLowerCase().includes('fabric') || key.includes('面料') || key.includes('材质')) {
      normalizedValue = normalizeFabric(value);
    }
    
    result[key] = {
      name: key,
      value,
      normalizedValue
    };
  }
  
  return result;
}

/**
 * 获取属性改写建议
 */
export function getAttributeSuggestions(category: string, locale: string): string[] {
  const suggestions: string[] = [];
  
  suggestions.push('颜色名称需本地化');
  suggestions.push('尺码表需符合目标市场标准');
  suggestions.push('面料成分需统一命名');
  
  if (category === '服装') {
    suggestions.push('建议添加: 领型、袖长、裤长等细项');
  } else if (category === '灯具') {
    suggestions.push('建议添加: 功率、色温、电压等参数');
  }
  
  return suggestions;
}

/**
 * 验证面料一致性（标题含棉，属性必须含棉）
 */
export function validateFabricConsistency(
  title: string,
  attributes: Record<string, string>
): { valid: boolean; message: string } {
  const titleHasCotton = /棉|丝绸|羊毛|羊绒/i.test(title);
  
  if (titleHasCotton) {
    const attrValues = Object.values(attributes).join('');
    const hasFabricAttr = /面料|材质|fabric|material/i.test(attrValues);
    
    if (!hasFabricAttr) {
      return {
        valid: false,
        message: '标题中提到面料材质，但属性中未找到面料描述'
      };
    }
    
    // 检查具体面料一致性
    const cottonTerms = ['棉', 'cotton', '丝绸', 'silk', '羊毛', 'wool'];
    for (const term of cottonTerms) {
      if (title.toLowerCase().includes(term.toLowerCase())) {
        if (!attrValues.toLowerCase().includes(term.toLowerCase())) {
          return {
            valid: false,
            message: `标题提到"${term}"，但属性中未包含`
          };
        }
      }
    }
  }
  
  return { valid: true, message: '面料一致性验证通过' };
}
