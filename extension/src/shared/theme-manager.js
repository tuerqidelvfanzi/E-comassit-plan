/**
 * 插件端主题管理器
 * 负责在 background/popup/content script 之间同步主题
 */

// Storage key
const THEME_STORAGE_KEY = 'psa_theme_data';

/**
 * 获取主题数据
 */
async function getThemeData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(THEME_STORAGE_KEY, (result) => {
      resolve(result[THEME_STORAGE_KEY] || null);
    });
  });
}

/**
 * 保存主题数据
 */
async function setThemeData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: data }, resolve);
  });
}

/**
 * 主题变化监听器
 */
function onThemeChange(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[THEME_STORAGE_KEY]) {
      callback(changes[THEME_STORAGE_KEY].newValue);
    }
  });
}

// 预设主题定义
const PRESET_THEMES = {
  'trello-premium': {
    name: 'Trello 高级风',
    primary: '#0079BF',
    bg: '#F7F7F7',
    surface: '#FFFFFF',
    text: '#172B4D',
  },
  'linear-dark': {
    name: 'Linear 极客风',
    primary: '#5E6AD2',
    bg: '#0D0D0D',
    surface: '#1A1A1A',
    text: '#E5E5E5',
  },
  'monday-vibrant': {
    name: 'Monday 活力风',
    primary: '#FF3D57',
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
  },
  'enterprise-classic': {
    name: '企业商务风',
    primary: '#1E40AF',
    bg: '#F1F5F9',
    surface: '#FFFFFF',
    text: '#1E293B',
  },
};

// 导出
if (typeof window !== 'undefined') {
  window.ThemeManager = {
    getThemeData,
    setThemeData,
    onThemeChange,
    PRESET_THEMES,
  };
}
