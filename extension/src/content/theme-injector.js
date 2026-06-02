/**
 * Content Script - 主题注入器
 * 将主题样式注入到目标页面
 */

// 注入的主题样式
let injectedStyle = null;

/**
 * 注入主题样式到页面
 */
function injectTheme(themeData) {
  if (!themeData) return;
  
  // 移除旧样式
  if (injectedStyle) {
    injectedStyle.remove();
  }
  
  // 生成 CSS
  const preset = themeData.presetId;
  const overrides = themeData.colorOverrides || {};
  
  // 基础颜色映射
  const colors = {
    'trello-premium': {
      primary: '#0079BF',
      bg: '#F7F7F7',
      surface: '#FFFFFF',
      text: '#172B4D',
      ...overrides,
    },
    'linear-dark': {
      primary: '#5E6AD2',
      bg: '#0D0D0D',
      surface: '#1A1A1A',
      text: '#E5E5E5',
      ...overrides,
    },
    'monday-vibrant': {
      primary: '#FF3D57',
      bg: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#1A1A1A',
      ...overrides,
    },
    'enterprise-classic': {
      primary: '#1E40AF',
      bg: '#F1F5F9',
      surface: '#FFFFFF',
      text: '#1E293B',
      ...overrides,
    },
  };
  
  const c = colors[preset] || colors['trello-premium'];
  
  const css = `
    [data-extension-theme="true"] {
      --ext-primary: ${c.primary};
      --ext-bg: ${c.bg};
      --ext-surface: ${c.surface};
      --ext-text: ${c.text};
      
      /* 覆盖目标元素的样式 */
      --color-primary: var(--ext-primary);
      --color-bg: var(--ext-bg);
      --color-surface: var(--ext-surface);
      --color-text: var(--ext-text);
    }
  `;
  
  // 注入新样式
  injectedStyle = document.createElement('style');
  injectedStyle.id = 'psa-extension-theme';
  injectedStyle.textContent = css;
  document.head.appendChild(injectedStyle);
}

// 监听来自 background 的主题同步
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'THEME_SYNC') {
    injectTheme(message.themeData);
  }
});

// 初始化时获取当前主题
chrome.runtime.sendMessage({ type: 'GET_THEME' }, (themeData) => {
  injectTheme(themeData);
});

console.log('[Content Script] Theme injector initialized');
