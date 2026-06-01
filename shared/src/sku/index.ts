/**
 * SKU编码生成模块
 * V3需求: FR-RW-03 SKU改写（五段编码）
 */

// 颜色编码表
export const COLOR_CODES: Record<string, string> = {
  '白': 'WH', '白色': 'WH', '白色系': 'WH', '米白': 'WH', '象牙白': 'WH',
  '黑': 'BK', '黑色': 'BK', '黑色系': 'BK',
  '红': 'RD', '红色': 'RD', '红色系': 'RD', '酒红': 'RD', '枣红': 'RD',
  '蓝': 'BL', '蓝色': 'BL', '蓝色系': 'BL', '浅蓝': 'BL', '深蓝': 'BL', '天蓝': 'BL',
  '绿': 'GR', '绿色': 'GR', '绿色系': 'GR', '浅绿': 'GR', '深绿': 'GR',
  '黄': 'YL', '黄色': 'YL', '黄色系': 'YL', '浅黄': 'YL', '姜黄': 'YL',
  '粉': 'PK', '粉色': 'PK', '粉色系': 'PK', '浅粉': 'PK', '玫粉': 'PK',
  '紫': 'PU', '紫色': 'PU', '紫色系': 'PU', '浅紫': 'PU', '深紫': 'PU',
  '橙': 'OR', '橙色': 'OR', '橙色系': 'OR', '橘色': 'OR',
  '灰': 'GY', '灰色': 'GY', '灰色系': 'GY', '浅灰': 'GY', '深灰': 'GY',
  '棕': 'BN', '棕色': 'BN', '褐色': 'BN', '深棕': 'BN', '浅棕': 'BN',
  '卡其': 'KH', '军绿': 'MG', '墨绿': 'DG', '香槟': 'CG', '珊瑚': 'CR'
};

// 尺码编码
export const SIZE_CODES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// 性别尺码对应
export const SIZE_BY_GENDER: Record<string, string[]> = {
  '男装': ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  '女装': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  '童装': ['80', '90', '100', '110', '120', '130', '140']
};

// 侧边编码
export const SIDE_CODES = {
  '正面': 'P',
  '反面': 'R',
  '正反面': 'PR'
};

export interface SkuConfig {
  prefix: string;
  sequence: number;
  side: 'P' | 'R' | 'PR';
  colors: string[];
  sizes: string[];
  hasPrint?: boolean; // 印花款式
  isSingleColor?: boolean; // 单色款式
}

export interface GeneratedSku {
  skuCode: string; // 五段编码: BF-0001-PR-WH-S
  color: string;
  colorCode: string;
  size: string;
  price: number;
  stock: number;
  weight: number;
  isWhiteHook?: boolean; // 白色钩子
  printSuffix?: '+B' | '+H'; // 印花后缀
}

export interface SkuMatrix {
  skus: GeneratedSku[];
  totalSkus: number;
  colors: string[];
  sizes: string[];
  hasWhiteHook: boolean;
  whiteHookSku?: GeneratedSku;
}

/**
 * 生成SKU矩阵（笛卡尔积）
 */
export function generateSkuMatrix(config: SkuConfig): SkuMatrix {
  const { prefix, sequence, side, colors, sizes, hasPrint, isSingleColor } = config;
  
  // 序列号格式化（4位）
  const seqStr = String(sequence).padStart(4, '0');
  const sideStr = SIDE_CODES[side === 'P' ? '正面' : side === 'R' ? '反面' : '正反面'];
  
  const skus: GeneratedSku[] = [];
  const colorsUsed: string[] = [];
  
  // 遍历颜色×尺码
  for (const color of colors) {
    const colorCode = COLOR_CODES[color] || color.substring(0, 2).toUpperCase();
    colorsUsed.push(color);
    
    for (const size of sizes) {
      // 基础SKU编码
      let skuCode = `${prefix}-${seqStr}-${sideStr}-${colorCode}-${size}`;
      
      // 印花后缀处理
      let printSuffix: '+B' | '+H' | undefined;
      if (hasPrint) {
        // +B: 白底黑花, +H: 黑底白花
        printSuffix = colorCode === 'WH' ? '+B' : '+H';
        skuCode += printSuffix;
      }
      
      skus.push({
        skuCode,
        color,
        colorCode,
        size,
        price: 0, // 价格由规则计算
        stock: 50,
        weight: 200,
        printSuffix
      });
    }
  }
  
  // 白色钩子处理
  let whiteHookSku: GeneratedSku | undefined;
  let hasWhiteHook = false;
  
  if (isSingleColor && colors.length === 1) {
    hasWhiteHook = true;
    const colorCode = COLOR_CODES[colors[0]] || colors[0].substring(0, 2).toUpperCase();
    const defaultSize = sizes[Math.floor(sizes.length / 2)] || 'M';
    
    whiteHookSku = {
      skuCode: `${prefix}-9999-P-${colorCode}-${defaultSize}`,
      color: colors[0],
      colorCode,
      size: defaultSize,
      price: 400, // 固定价格
      stock: 5, // 固定库存
      weight: 220, // 固定重量
      isWhiteHook: true
    };
  }
  
  return {
    skus,
    totalSkus: skus.length + (hasWhiteHook ? 1 : 0),
    colors: colorsUsed,
    sizes,
    hasWhiteHook,
    whiteHookSku
  };
}

/**
 * 解析颜色名称为编码
 */
export function parseColorCode(colorName: string): string {
  return COLOR_CODES[colorName] || colorName.substring(0, 2).toUpperCase();
}

/**
 * 解析尺码名称
 */
export function parseSizeCode(sizeName: string): string {
  const upper = sizeName.toUpperCase();
  if (SIZE_CODES.includes(upper)) return upper;
  return sizeName;
}

/**
 * 验证SKU编码格式
 */
export function validateSkuCode(skuCode: string): boolean {
  // 格式: PREFIX-0001-SIDE-COLOR-SIZE
  const regex = /^[A-Z]{2,4}-\d{4}-[PR]{1,2}-[A-Z]{2}-[A-Z0-9]{1,4}(\+[BH])?$/;
  return regex.test(skuCode);
}

/**
 * 解析SKU编码
 */
export function parseSkuCode(skuCode: string): {
  prefix: string;
  sequence: number;
  side: string;
  color: string;
  size: string;
  printSuffix?: string;
} | null {
  const match = skuCode.match(/^([A-Z]{2,4})-(\d{4})-([PR]{1,2})-([A-Z]{2})(-([A-Z0-9]+))?(\+[BH])?$/);
  if (!match) return null;
  
  return {
    prefix: match[1],
    sequence: parseInt(match[2]),
    side: match[3],
    color: match[4],
    size: match[6] || match[5],
    printSuffix: match[7]
  };
}
