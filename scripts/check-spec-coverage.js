/**
 * SPEC 对照检查
 * 用途: 比较 SPEC.md 中定义的功能与实际实现是否一致
 * 设计: 防错式 - 缺失任何 SPEC 功能则返回非 0 退出码
 *
 * 当前 SPEC: docs/theme-system/SPEC.md
 * 检查目标:
 *   1. 4 个预设主题包必须实现
 *   2. 8 个维度类型必须导出
 *   3. ColorScheme 必须包含全部字段
 *   4. useThemeV2 hook 必须存在
 *   5. THEME_PRESETS 必须导出
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPEC_PATH = path.join(ROOT, 'docs/theme-system/SPEC.md');
const THEME_IMPL = path.join(ROOT, 'web/src/lib/theme-v2.ts');
const SETTINGS_IMPL = path.join(ROOT, 'web/src/lib/ThemeSettingsV2.tsx');

let failed = false;
const errors = [];

function fail(msg) {
  failed = true;
  errors.push(msg);
  console.error('❌ ' + msg);
}

function pass(msg) {
  console.log('✅ ' + msg);
}

// 1. 文件存在性
if (!fs.existsSync(SPEC_PATH)) {
  fail('SPEC 文件不存在: ' + SPEC_PATH);
  process.exit(1);
}
if (!fs.existsSync(THEME_IMPL)) {
  fail('主题实现文件不存在: ' + THEME_IMPL);
  process.exit(1);
}
if (!fs.existsSync(SETTINGS_IMPL)) {
  fail('主题设置组件不存在: ' + SETTINGS_IMPL);
  process.exit(1);
}

// 2. 读取实现
const themeImpl = fs.readFileSync(THEME_IMPL, 'utf-8');
const settingsImpl = fs.readFileSync(SETTINGS_IMPL, 'utf-8');

// 3. 检查 4 个预设主题包
const REQUIRED_THEMES = [
  'trello-premium',
  'linear-dark',
  'monday-vibrant',
  'enterprise-classic',
];
for (const id of REQUIRED_THEMES) {
  if (!themeImpl.includes("id: '" + id + "'")) {
    fail('缺失预设主题包: ' + id);
  } else {
    pass('主题包 ' + id + ' 已实现');
  }
}

// 4. 检查 8 个维度类型（注意：实际类型名是 ShadowLevel / MotionLevel）
const REQUIRED_TYPES = [
  'VisualStyle',
  'Density',
  'Radius',
  'Spacing',
  'ShadowLevel',
  'MotionLevel',
  'ThemePreset',
  'ColorScheme',
];
for (const t of REQUIRED_TYPES) {
  // 注：JS 字符串中 \s 和 \b 在文件里实际是单反斜杠，传给 RegExp 即可
  const re = new RegExp('(type|interface)\\s+' + t + '\\b');
  if (!re.test(themeImpl)) {
    fail('缺失类型定义: ' + t);
  } else {
    pass('类型 ' + t + ' 已定义');
  }
}

// 5. 检查 ColorScheme 字段
const REQUIRED_COLOR_FIELDS = [
  'primary', 'primaryFg', 'bg', 'surface', 'text',
  'textMuted', 'border', 'success', 'warn', 'danger',
];
let colorFieldMissing = 0;
for (const f of REQUIRED_COLOR_FIELDS) {
  const re = new RegExp('\\b' + f + ':\\s*string');
  if (!re.test(themeImpl)) {
    fail('ColorScheme 缺失字段: ' + f);
    colorFieldMissing++;
  }
}
if (colorFieldMissing === 0) {
  pass('ColorScheme 全部字段已实现');
}

// 6. 检查 useThemeV2 hook
if (!/export\s+function\s+useThemeV2\b/.test(themeImpl) &&
    !/export\s+const\s+useThemeV2\b/.test(themeImpl)) {
  fail('缺失 useThemeV2 hook');
} else {
  pass('useThemeV2 hook 已导出');
}

// 7. 检查 THEME_PRESETS
if (!/export\s+const\s+THEME_PRESETS\b/.test(themeImpl)) {
  fail('缺失 THEME_PRESETS 常量');
} else {
  pass('THEME_PRESETS 已导出');
}

// 8. 检查 ThemeSettingsV2 组件
if (!/export\s+function\s+ThemeSettingsV2\b/.test(settingsImpl)) {
  fail('缺失 ThemeSettingsV2 组件');
} else {
  pass('ThemeSettingsV2 组件已导出');
}

// 9. 报告
console.log('');
if (failed) {
  console.error('❌ SPEC 对照检查失败: ' + errors.length + ' 项缺失');
  process.exit(1);
} else {
  console.log('✅ SPEC 对照检查通过（4 主题 + 8 维度 + 10 颜色字段）');
  process.exit(0);
}
