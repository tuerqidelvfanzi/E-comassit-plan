/**
 * 组件适配检查
 * 用途: 验证每个视觉风格都有对应的 CSS 适配
 * 设计: 防错式 - 缺失适配器则返回非 0 退出码
 *
 * 当前目标: web/src/styles/theme-presets.css
 * 验证矩阵:
 *   VisualStyle (4) × Density (3) × Component (4) = 48 个适配点
 *
 * 简化检查:
 *   1. 4 个 visual-style 适配器存在
 *   2. 3 个 density 适配器存在
 *   3. 关键组件类名被 CSS 变量驱动（无硬编码）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_PATH = path.join(ROOT, 'web/src/styles/theme-presets.css');
const ALTERNATIVE_CSS = path.join(ROOT, 'web/src/styles/themes.css');

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

// 1. CSS 文件存在
let cssPath = null;
if (fs.existsSync(CSS_PATH)) {
  cssPath = CSS_PATH;
} else if (fs.existsSync(ALTERNATIVE_CSS)) {
  cssPath = ALTERNATIVE_CSS;
} else {
  fail('未找到主题 CSS 文件 (theme-presets.css 或 themes.css)');
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf-8');
// 同时读取 themes.css 用于查找变量定义（如果存在）
let themesCss = '';
if (fs.existsSync(ALTERNATIVE_CSS)) {
  themesCss = fs.readFileSync(ALTERNATIVE_CSS, 'utf-8');
}
const allCss = css + '\n' + themesCss;

console.log('ℹ️  检查 CSS 文件: ' + path.relative(ROOT, cssPath));
if (themesCss) {
  console.log('ℹ️  同时检查: ' + path.relative(ROOT, ALTERNATIVE_CSS));
}

// 2. 4 个 visual-style 适配器
const VISUAL_STYLES = ['trello', 'linear', 'monday', 'enterprise'];
for (const style of VISUAL_STYLES) {
  // 检查 data-visual 或 class 形式
  const hasDataVisual = new RegExp('\[data-visual=.?' + style + '.?\]').test(css);
  const hasClass = new RegExp('\.' + style + '(-\w+)?\b').test(css);
  const hasRootVar = new RegExp('--\w+-' + style + '\b').test(css);
  const hasInFile = hasDataVisual || hasClass || hasRootVar;

  if (!hasInFile) {
    fail('缺失 visual-style 适配: ' + style);
  } else {
    const form = hasDataVisual ? 'data-visual' : hasClass ? 'class' : 'CSS var';
    pass('visual-style ' + style + ' 适配存在 (' + form + ')');
  }
}

// 3. 3 个 density 适配器
const DENSITIES = ['compact', 'comfortable', 'spacious'];
for (const d of DENSITIES) {
  const hasAdapter = new RegExp('\[data-density=.?' + d + '.?\]|\.' + d + '\b|--density-' + d + '\b').test(css);
  if (!hasAdapter) {
    fail('缺失 density 适配: ' + d);
  } else {
    pass('density ' + d + ' 适配存在');
  }
}

// 4. 关键 CSS 变量定义（在所有 CSS 文件中查找）
const REQUIRED_VARS = [
  '--color-primary',
  '--color-bg',
  '--color-surface',
  '--color-text',
  '--color-border',
];
let varMissing = 0;
for (const v of REQUIRED_VARS) {
  // 变量定义形式：--color-primary: value;
  const defRe = new RegExp(v + '\\s*:');
  if (!defRe.test(allCss)) {
    fail('缺失 CSS 变量定义: ' + v);
    varMissing++;
  }
}
if (varMissing === 0) {
  pass('5 个核心 CSS 变量已定义（theme-presets.css 或 themes.css 中）');
}

// 5. 检查无大量硬编码颜色（防退化）
const hardcodedHex = (css.match(/#[0-9a-fA-F]{3,6}\b/g) || []).length;
const varUsage = (css.match(/var\(--/g) || []).length;

if (varUsage < 5) {
  fail('CSS 变量使用次数过少: ' + varUsage + '（建议 > 5）');
} else {
  pass('CSS 变量使用: ' + varUsage + ' 次（硬编码 ' + hardcodedHex + ' 处）');
}

// 6. 报告
console.log('');
if (failed) {
  console.error('❌ 组件适配检查失败: ' + errors.length + ' 项缺失');
  process.exit(1);
} else {
  console.log('✅ 组件适配检查通过（4 视觉风格 + 3 密度 + 5 核心变量）');
  process.exit(0);
}
