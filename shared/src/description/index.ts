/**
 * 描述改写模块
 * V3需求: FR-RW-02 描述改写
 */

/** 越南短描述 - 必须≤20字符 */
export interface VietnamShortDescription {
  text: string;        // 越南语短描述
  charCount: number;    // 字符计数
  emoji: string[];      // 使用的emoji
}

/** 详情描述结构 */
export interface LocalizedDescription {
  locale: string;           // vi-VN, th-TH, fil-PH, id-ID
  shortDescription: string; // 短描述≤20字
  mainDescription: string;  // 主描述（段落）
  specsSection: string;      // 规格参数区
  shippingSection: string;   // 物流/售后区
  careSection: string;       // 洗护说明区
}

/** 各国售后话术 */
export const AFTERSALE_MESSAGES: Record<string, string[]> = {
  'vi-VN': [
    '✅ Hàng có sẵn, giao trong 2-5 ngày',
    '✅ 7 ngày đổi trả miễn phí',
    '✅ Bảo hành chất lượng 30 ngày',
    '✅ Kiểm tra hàng trước khi thanh toán'
  ],
  'th-TH': [
    '✅ สินค้าพร้อมส่ง ภายใน 3-7 วัน',
    '✅ เปลี่ยนสินค้าฟรี 7 วัน',
    '✅ รับประกันคุณภาพ 30 วัน',
    '✅ ตรวจสอบสินค้าก่อนชำระเงิน'
  ],
  'fil-PH': [
    '✅ Available stock, delivered in 3-7 days',
    '✅ 7 days free return/exchange',
    '✅ 30 days quality warranty',
    '✅ Check item before payment'
  ],
  'id-ID': [
    '✅ Stok tersedia, pengiriman 3-7 hari',
    '✅ 7 hari pengembalian gratis',
    '✅ Garansi kualitas 30 hari',
    '✅ Periksa barang sebelum bayar'
  ]
};

/** 各国洗护说明 */
export const CARE_INSTRUCTIONS: Record<string, string[]> = {
  'vi-VN': [
    '• Giặt máy ở nhiệt độ thấp',
    '• Không sấy khô bằng máy',
    '• Ủi ở nhiệt độ trung bình',
    '• Không tẩy trắng'
  ],
  'th-TH': [
    '• ซักด้วยน้ำอุณหภูมิต่ำ',
    '• ไม่ควรอบแห้งด้วยเครื่อง',
    '• รีดด้วยอุณหภูมิปานกลาง',
    '• ไม่ฟอกขาว'
  ],
  'fil-PH': [
    '• Wash in low temperature',
    '• Do not machine dry',
    '• Iron on medium heat',
    '• Do not bleach'
  ],
  'id-ID': [
    '• Cuci dengan suhu rendah',
    '• Jangan keringkan dengan mesin',
    '• Setrika suhu sedang',
    '• Jangan gunakan pemutih'
  ]
};

/**
 * 生成越南短描述（≤20字符）
 */
export function generateVietnamShortDescription(keywords: string[]): VietnamShortDescription {
  const emoji = ['🛒', '🔥', '✨', '💯', '👶', '👧'];
  const shortTerms: Record<string, string> = {
    'T恤': 'Áo thun',
    '短袖': 'tay ngắn',
    '纯棉': 'cotton',
    '儿童': 'trẻ em',
    '卡通': 'hoạt hình',
    '印花': 'in hoa',
    '百搭': 'dễ phối',
    '可爱': 'dễ thương',
    '夏季': 'mùa hè',
    '休闲': 'thoải mái'
  };
  
  let text = '';
  for (const kw of keywords) {
    if (shortTerms[kw]) {
      if (text.length + shortTerms[kw].length <= 15) {
        text += (text ? ' ' : '') + shortTerms[kw];
      }
    }
  }
  
  // 添加emoji
  const usedEmoji = emoji.slice(0, 1);
  const fullText = usedEmoji[0] + ' ' + text;
  
  return {
    text: fullText,
    charCount: Array.from(fullText).filter(c => !/\s/.test(c)).length,
    emoji: usedEmoji
  };
}

/**
 * 生成完整本地化描述
 */
export function generateLocalizedDescription(
  locale: string,
  originalDescription: string,
  keywords: string[]
): LocalizedDescription {
  const shortDesc = generateVietnamShortDescription(keywords);
  
  // 生成主描述
  const mainDesc = generateMainDescription(locale, originalDescription, keywords);
  
  // 生成规格参数区
  const specsSection = generateSpecsSection(locale);
  
  // 生成物流/售后区
  const shippingSection = (AFTERSALE_MESSAGES[locale] || AFTERSALE_MESSAGES['fil-PH']).join('\n');
  
  // 生成洗护说明区
  const careSection = (CARE_INSTRUCTIONS[locale] || CARE_INSTRUCTIONS['fil-PH']).join('\n');
  
  return {
    locale,
    shortDescription: shortDesc.text,
    mainDescription: mainDesc,
    specsSection,
    shippingSection,
    careSection
  };
}

/**
 * 生成主描述
 */
function generateMainDescription(locale: string, original: string, keywords: string[]): string {
  const introPhrases: Record<string, string[]> = {
    'vi-VN': [
      'Mô tả sản phẩm:',
      'Sản phẩm được yêu thích nhất hiện nay!'
    ],
    'th-TH': [
      'รายละเอียดสินค้า:',
      'สินค้าขายดีที่สุดในตอนนี้!'
    ],
    'fil-PH': [
      'Product Description:',
      'Best selling item right now!'
    ],
    'id-ID': [
      'Deskripsi Produk:',
      'Produk terlaris saat ini!'
    ]
  };
  
  const intros = introPhrases[locale] || introPhrases['fil-PH'];
  
  return `${intros[0]}
${intros[1]}

${original.slice(0, 200)}${original.length > 200 ? '...' : ''}`;
}

/**
 * 生成规格参数区
 */
function generateSpecsSection(locale: string): string {
  const specsLabels: Record<string, Record<string, string>> = {
    'vi-VN': {
      'Chất liệu': 'Vải cotton',
      'Xuất xứ': 'Trung Quốc',
      'Phong cách': 'Hàn Quốc'
    },
    'th-TH': {
      'วัสดุ': 'ผ้าฝ้าย',
      'แหล่งที่มา': 'จีน',
      'สไตล์': 'เกาหลี'
    },
    'fil-PH': {
      'Material': 'Cotton fabric',
      'Origin': 'China',
      'Style': 'Korean style'
    },
    'id-ID': {
      'Bahan': 'Kain katun',
      'Asal': 'China',
      'Gaya': 'Gaya Korea'
    }
  };
  
  const labels = specsLabels[locale] || specsLabels['fil-PH'];
  return Object.entries(labels)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join('\n');
}

/**
 * 验证短描述字符数
 */
export function validateShortDescription(text: string, locale: string): { valid: boolean; charCount: number; maxChars: number } {
  const maxChars = locale === 'vi-VN' ? 20 : locale === 'th-TH' ? 220 : 120;
  const charCount = Array.from(text).filter(c => !/\s/.test(c)).length;
  
  return {
    valid: charCount <= maxChars,
    charCount,
    maxChars
  };
}
