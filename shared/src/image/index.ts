/**
 * 图片改写模块
 * V3需求: FR-RW-04 图片改写
 */

/** 图片处理状态 */
export type ImageProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 处理后的图片 */
export interface ProcessedImage {
  id: string;
  originalUrl: string;
  processedUrl?: string;
  status: ImageProcessingStatus;
  issues: ImageIssue[];
  isMainImage: boolean;  // 主图（越南需白底）
}

/** 图片问题 */
export interface ImageIssue {
  type: 'watermark' | 'logo' | 'price' | 'chinese_text' | 'wrong_count' | 'wrong_size';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: { x: number; y: number; width: number; height: number };
}

/** 各国图片要求 */
export const IMAGE_REQUIREMENTS: Record<string, {
  name: string;
  minCount: number;
  maxCount: number;
  aspectRatio: string;
  minSize: number;
  mainImageWhiteBg: boolean;
}> = {
  'vi-VN': {
    name: '越南',
    minCount: 9,
    maxCount: 15,
    aspectRatio: '1:1',
    minSize: 800,
    mainImageWhiteBg: true
  },
  'th-TH': {
    name: '泰国',
    minCount: 5,
    maxCount: 20,
    aspectRatio: '1:1',
    minSize: 800,
    mainImageWhiteBg: false
  },
  'fil-PH': {
    name: '菲律宾',
    minCount: 9,
    maxCount: 20,
    aspectRatio: '1:1',
    minSize: 800,
    mainImageWhiteBg: false
  },
  'id-ID': {
    name: '印尼',
    minCount: 6,
    maxCount: 20,
    aspectRatio: '1:1',
    minSize: 800,
    mainImageWhiteBg: false
  }
};

/** 需要消除的内容类型 */
export const CONTENT_TO_REMOVE = {
  watermarks: ['1688', '阿里巴巴', 'Alibaba', '淘', '天猫', 'TMALL'],
  logos: ['品牌LOGO', '厂家水印', '代理标识'],
  prices: ['¥', '￥', '$', '元', '原价', '促销价', '折扣'],
  chineseText: true,
  otherPlatforms: ['淘宝', '天猫', '京东', '拼多多', '抖音']
};

/**
 * 验证图片数量
 */
export function validateImageCount(images: string[], locale: string): ImageIssue | null {
  const req = IMAGE_REQUIREMENTS[locale];
  if (!req) return null;
  
  if (images.length < req.minCount) {
    return {
      type: 'wrong_count',
      severity: 'error',
      message: `图片数量不足：需要至少${req.minCount}张，当前${images.length}张`
    };
  }
  
  if (images.length > req.maxCount) {
    return {
      type: 'wrong_count',
      severity: 'warning',
      message: `图片数量超出限制：建议${req.maxCount}张以内，当前${images.length}张`
    };
  }
  
  return null;
}

/**
 * 检测图片问题
 */
export function detectImageIssues(imageUrl: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  const lowerUrl = imageUrl.toLowerCase();
  
  // 检测水印
  for (const wm of CONTENT_TO_REMOVE.watermarks) {
    if (lowerUrl.includes(wm.toLowerCase())) {
      issues.push({
        type: 'watermark',
        severity: 'warning',
        message: `检测到水印标记: ${wm}`
      });
    }
  }
  
  // 检测价格标签
  for (const price of CONTENT_TO_REMOVE.prices) {
    if (lowerUrl.includes(price.toLowerCase())) {
      issues.push({
        type: 'price',
        severity: 'error',
        message: `检测到价格标签: ${price}`
      });
    }
  }
  
  return issues;
}

/**
 * 处理图片（模拟）
 */
export async function processImage(
  imageUrl: string,
  options: {
    locale: string;
    removeWatermarks?: boolean;
    resizeToSquare?: boolean;
    makeWhiteBg?: boolean;
  }
): Promise<ProcessedImage> {
  const issues = detectImageIssues(imageUrl);
  
  return {
    id: `img-${Date.now()}`,
    originalUrl: imageUrl,
    status: 'completed',
    issues,
    isMainImage: false
  };
}

/**
 * 批量处理图片
 */
export async function processImageBatch(
  images: string[],
  locale: string,
  options?: {
    removeWatermarks?: boolean;
    resizeToSquare?: boolean;
  }
): Promise<ProcessedImage[]> {
  const req = IMAGE_REQUIREMENTS[locale];
  const results: ProcessedImage[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const isMainImage = i === 0;
    const processed = await processImage(images[i], {
      locale,
      ...options,
      makeWhiteBg: req?.mainImageWhiteBg && isMainImage
    });
    processed.isMainImage = isMainImage;
    results.push(processed);
  }
  
  return results;
}

/**
 * 验证主图白底（越南）
 */
export function validateMainImageWhiteBg(image: ProcessedImage, locale: string): ImageIssue | null {
  const req = IMAGE_REQUIREMENTS[locale];
  if (locale === 'vi-VN' && image.isMainImage && req?.mainImageWhiteBg) {
    return {
      type: 'chinese_text',
      severity: 'warning',
      message: '越南市场第一张图必须为白底主图'
    };
  }
  return null;
}

/**
 * 获取图片处理建议
 */
export function getImageProcessingSuggestions(locale: string): string[] {
  const req = IMAGE_REQUIREMENTS[locale];
  if (!req) return [];
  
  const suggestions: string[] = [];
  
  if (req.mainImageWhiteBg) {
    suggestions.push('第一张图需处理为白底主图');
  }
  
  suggestions.push(`图片尺寸调整为 ${req.minSize}x${req.minSize} (${req.aspectRatio})`);
  suggestions.push('使用消除笔去除水印、LOGO、价格标签');
  suggestions.push('图片文字需翻译为当地语言或移除');
  suggestions.push(`数量要求: ${req.minCount}-${req.maxCount}张`);
  
  return suggestions;
}
