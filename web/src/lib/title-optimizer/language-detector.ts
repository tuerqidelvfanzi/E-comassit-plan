/**
 * F-C1 多语言支持 - 语言检测（简化版，不引入 franc）
 * 用途: 检测标题语言，辅助 SEO 评分
 */
import type { Language } from './platform-rules';

const SCRIPT_RANGES: Array<{ regex: RegExp; lang: Language }> = [
  { regex: /[一-鿿]/, lang: 'zh' }, // 中文
  { regex: /[぀-ゟ゠-ヿ]/, lang: 'ja' }, // 日文
  { regex: /[가-힯]/, lang: 'ko' }, // 韩文
  { regex: /[Ѐ-ӿ]/, lang: 'fr' }, // 西里尔（误判为俄语，但这里 fallback 到 fr）
  { regex: /[ñáéíóú]/i, lang: 'es' }, // 西班牙语特征字符
  { regex: /[a-zA-Z]/, lang: 'en' }, // 默认英文
];

export function detectLanguage(text: string): Language {
  for (const { regex, lang } of SCRIPT_RANGES) {
    if (regex.test(text)) return lang;
  }
  return 'en';
}

export function getLanguageName(lang: Language): string {
  const names: Record<Language, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
    es: 'Español',
    fr: 'Français',
  };
  return names[lang] || lang;
}
