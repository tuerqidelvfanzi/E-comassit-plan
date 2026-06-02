/**
 * 设计保留检查
 * 用途: 验证修改没有删减原始设计规格中的功能
 * 设计: 防错式 - 检测删除操作 vs 新增操作的比例
 *
 * 触发条件: 在 .ts/.tsx/.css/.md 变更后
 * 检查项目:
 *   1. SPEC 中列出的功能在实现中仍然存在
 *   2. 删除的代码行数 vs 新增行数（防止"精简"误操作）
 *   3. 关键配置项没有被删除
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

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

// 1. 检查 git 状态
let stagedFiles = [];
try {
  const out = execSync('git diff --cached --name-only', { cwd: ROOT, encoding: 'utf-8' });
  stagedFiles = out.trim().split('\n').filter(Boolean);
} catch (e) {
  console.log('⚠️  无法读取 git staged 文件: ' + e.message);
}

if (stagedFiles.length === 0) {
  console.log('ℹ️  无暂存文件，跳过设计保留检查');
  process.exit(0);
}

// 2. 关键配置文件 - 不允许被删除或清空
const PROTECTED_FILES = [
  'docs/theme-system/SPEC.md',
  'docs/PIPELINE.md',
  'docs/TOOLS.md',
  'CLAUDE.md',
  'AGENTS.md',
  '.claude/design-preservation.md',
  'web/src/lib/theme-v2.ts',
  'web/src/lib/ThemeSettingsV2.tsx',
  'web/src/styles/theme-presets.css',
  'web/src/styles/themes.css',
];

let protectedMissing = 0;
for (const f of PROTECTED_FILES) {
  const fullPath = path.join(ROOT, f);
  if (!fs.existsSync(fullPath)) {
    fail('关键文件被删除: ' + f);
    protectedMissing++;
    continue;
  }
  const stat = fs.statSync(fullPath);
  if (stat.size === 0) {
    fail('关键文件被清空: ' + f + ' (0 bytes)');
    protectedMissing++;
  }
}
if (protectedMissing === 0) {
  pass('所有受保护文件存在且非空');
}

// 3. 检查删除/新增比例（防止"大刀阔斧"删减）
let totalAdded = 0;
let totalRemoved = 0;
let codeFiles = stagedFiles.filter(f =>
  /\.(ts|tsx|js|jsx|css|md)$/.test(f)
);

for (const f of codeFiles) {
  try {
    const out = execSync(
      'git diff --cached --numstat -- "' + f + '"',
      { cwd: ROOT, encoding: 'utf-8' }
    );
    const parts = out.trim().split(/\s+/);
    if (parts.length >= 2) {
      const added = parseInt(parts[0], 10) || 0;
      const removed = parseInt(parts[1], 10) || 0;
      totalAdded += added;
      totalRemoved += removed;
    }
  } catch (e) {
    // 文件可能未跟踪
  }
}

console.log('ℹ️  暂存变更: +' + totalAdded + ' -' + totalRemoved + ' (' + codeFiles.length + ' 个文件)');

if (totalRemoved > 0 && totalAdded === 0) {
  fail('纯删除提交: -' + totalRemoved + ' 行, +0 行 (疑似破坏性操作)');
} else if (totalRemoved > totalAdded * 3 && totalRemoved > 100) {
  fail('删除远多于新增: -' + totalRemoved + ' vs +' + totalAdded + ' (>3倍)，请确认设计保留');
}

// 4. SPEC 必备功能验证 - 在 web/src/lib/theme-v2.ts 中必须存在
const themeImpl = path.join(ROOT, 'web/src/lib/theme-v2.ts');
if (fs.existsSync(themeImpl)) {
  const content = fs.readFileSync(themeImpl, 'utf-8');
  const requiredThemes = [
    'trello-premium', 'linear-dark', 'monday-vibrant', 'enterprise-classic',
  ];
  let themeMissing = 0;
  for (const id of requiredThemes) {
    if (!content.includes("id: '" + id + "'")) {
      fail('主题被删除: ' + id);
      themeMissing++;
    }
  }
  if (themeMissing === 0) {
    pass('4 个主题包全部保留');
  }
}

// 5. 报告
console.log('');
if (failed) {
  console.error('❌ 设计保留检查失败: ' + errors.length + ' 项违规');
  process.exit(1);
} else {
  console.log('✅ 设计保留检查通过');
  process.exit(0);
}
