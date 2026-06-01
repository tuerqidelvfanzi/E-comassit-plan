/**
 * 36主题系统的CSS变量定义
 */

export const THEME_CSS: Record<string, string> = {
  'minimal-white': ,

  'dracula': ,

  'jade': ,

  'cyberpunk-neon': ,

  'tokyo-night': ,

  'nord': ,

  'vaporwave': ,

  'sunset': ,

  'y2k-chrome': ,

  'xiaohongshu-white': ,

  'japanese-minimal': ,
};

export function injectThemeCss(themeId: string) {
  const css = THEME_CSS[themeId];
  if (!css) return false;
  let styleEl = document.getElementById('psa-theme-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'psa-theme-styles';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
  return true;
}

export function removeThemeCss() {
  document.getElementById('psa-theme-styles')?.remove();
}
