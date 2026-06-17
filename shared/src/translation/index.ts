/**
 * 翻译词库模块
 * V3需求: FR-CFG-04 翻译词库
 */

// 服装类术语翻译
export const CLOTHING_TERMS: Record<string, Record<string, string>> = {
  'zh-vi': { // 中文→越南语
    'T恤': 'áo thun',
    '短袖': 'tay ngắn',
    '长袖': 'tay dài',
    '衬衫': 'áo sơ mi',
    '卫衣': 'áo hoodie',
    '毛衣': 'áo len',
    '外套': 'áo khoác',
    '羽绒服': 'áo lông vũ',
    '裤子': 'quần',
    '牛仔裤': 'quần jean',
    '裙子': 'váy',
    '连衣裙': 'đầm',
    '童装': 'quần áo trẻ em',
    '男童': 'bé trai',
    '女童': 'bé gái',
    '儿童': 'trẻ em',
    '纯棉': 'cotton 100%',
    '棉质': 'vải cotton',
    '聚酯纤维': 'polyester',
    '丝绸': 'lụa',
    '羊毛': 'len',
    '蓝色': 'xanh dương',
    '白色': 'trắng',
    '黑色': 'đen',
    '红色': 'đỏ',
    '粉色': 'hồng',
    '黄色': 'vàng',
    '绿色': 'xanh lá',
    '紫色': 'tím',
    '灰色': 'xám',
    '可爱': 'dễ thương',
    '时尚': 'thời trang',
    '休闲': 'thoải mái',
    '百搭': 'dễ phối',
    '运动': 'thể thao',
    '韩版': 'Hàn Quốc',
    '日系': 'Nhật Bản',
    '卡通': 'hoạt hình',
    '印花': 'in hoa',
    '刺绣': 'thêu',
    '修身': 'ôm body',
    '宽松': 'rộng rãi',
    '加厚': 'dày',
    '薄款': 'mỏng',
    '新款': 'mới',
    '夏季': 'mùa hè',
    '冬季': 'mùa đông',
    '春秋': 'xuân thu',
    '小熊': 'gấu',
    '卡通图案': 'họa tiết hoạt hình'
  },
  'zh-th': { // 中文→泰语
    'T恤': 'เสื้อยืด',
    '短袖': 'แขนสั้น',
    '长袖': 'แขนยาว',
    '衬衫': 'เสื้อเชิ้ต',
    '纯棉': 'ผ้าฝ้าย 100%',
    '儿童': 'เด็ก',
    '男童': 'เด็กชาย',
    '女童': 'เด็กหญิง',
    '蓝色': 'สีน้ำเงิน',
    '白色': 'สีขาว',
    '黑色': 'สีดำ',
    '可爱': 'น่ารัก',
    '时尚': 'แฟชั่น',
    '休闲': 'สบาย',
    '新款': 'รุ่นใหม่'
  },
  'zh-en': { // 中文→英语（菲律宾/通用）
    'T恤': 'T-shirt',
    '短袖': 'short sleeve',
    '长袖': 'long sleeve',
    '衬衫': 'shirt',
    '纯棉': '100% cotton',
    '儿童': 'kids',
    '男童': 'boys',
    '女童': 'girls',
    '蓝色': 'blue',
    '白色': 'white',
    '黑色': 'black',
    '可爱': 'cute',
    '时尚': 'fashion',
    '休闲': 'casual',
    '新款': 'new arrival'
  }
};

// 平台特定词
export const PLATFORM_TERMS: Record<string, Record<string, string>> = {
  'shopee-vi': {
    '越南Shopee': 'Shopee Việt Nam',
    '官方正品': 'hàng chính hãng',
    '七天无理由': '7 ngày hoàn trả'
  },
  'tiktok-th': {
    '泰国TikTok': 'TikTok Thái Lan',
    '正品保证': 'รับประกันของแท้'
  }
};

// 常用表达
export const COMMON_PHRASES: Record<string, string[]> = {
  'vi-VN': [
    'Mua ngay!',
    'Hàng mới về!',
    'Siêu hot!',
    'Giá tốt nhất!',
    'Freeship mọi miền!'
  ],
  'th-TH': [
    'ซื้อเลย!',
    'สินค้าใหม่!',
    'ยอดนิยม!',
    'ราคาดีที่สุด!'
  ]
};

/**
 * 翻译单个词汇
 */
export function translateWord(
  word: string,
  sourceLang: string = 'zh',
  targetLang: string = 'vi'
): string {
  const key = `${sourceLang}-${targetLang}`;
  const dict = CLOTHING_TERMS[key];
  
  if (dict && dict[word]) {
    return dict[word];
  }
  
  // 如果没有找到，返回原词
  return word;
}

/**
 * 翻译短语（保留标点）
 */
export function translatePhrase(
  phrase: string,
  targetLang: string = 'vi'
): string {
  const words = phrase.split(/([\s，。、！？‘’""（）《》【】]+)/);
  
  const langMap: Record<string, string> = {
    'vi': 'vi',
    'th': 'th',
    'vi-VN': 'vi',
    'th-TH': 'th',
    'en': 'en',
    'fil-PH': 'en',
    'id-ID': 'id'
  };
  
  const lang = langMap[targetLang] || 'vi';
  
  return words.map(word => {
    if (/^[\s，。、！？‘’""（）《》【】]+$/.test(word)) {
      return word;
    }
    return translateWord(word, 'zh', lang);
  }).join('');
}

/**
 * 获取平台特定翻译
 */
export function getPlatformTerm(platform: string, term: string): string {
  const key = `${platform}`;
  const dict = PLATFORM_TERMS[key];
  
  if (dict && dict[term]) {
    return dict[term];
  }
  
  return term;
}

/**
 * 获取常用表达
 */
export function getCommonPhrase(locale: string): string {
  const phrases = COMMON_PHRASES[locale];
  if (!phrases || phrases.length === 0) {
    return '';
  }
  return phrases[Math.floor(Math.random() * phrases.length)];
}
