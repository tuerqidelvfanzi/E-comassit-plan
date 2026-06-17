/** BRD §8.2 演示违禁词扫描 */
export const BANNED_TERMS = [
  '耐克',
  'Nike',
  '阿迪达斯',
  'Adidas',
  '迪士尼',
  'Disney',
  'LV',
  '路易威登',
  'Gucci',
  '古驰',
  'Chanel',
  '香奈儿',
  '爱马仕',
  'Hermès',
  '苹果',
  'Apple',
  '三星',
  'Samsung',
  '华为',
  'Huawei',
  'NASA',
  '3C认证',
  '产地',
  '发货地',
  '最便宜',
  '全网最低',
  '绝对',
  '100%正品',
];

export function scanBannedTerms(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const term of BANNED_TERMS) {
    if (text.includes(term)) found.push(term);
  }
  return found;
}
