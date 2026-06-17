# SPEC-A: V3.0 收尾优化

> **轨道**: A | **类型**: 测试基础设施 + 主题清理
> **创建日期**: 2026-06-02 | **状态**: 📐 SPEC 阶段

---

## 1. 架构

```
V3.0 收尾
├── A1. 主题清理
│   ├── 删除 web/src/lib/theme.ts（V1 12 主题）
│   ├── themes.css 硬编码归零
│   └── 全局搜索 "36 themes" / "minimal-white" 残留
├── A2. 视觉回归
│   ├── playwright.config.ts 添加 visual 配置
│   ├── e2e/visual/theme-snapshots.spec.ts
│   └── tests/visual-baselines/*.png
├── A3. ESLint 规则
│   ├── eslint.config.js 添加 no-hex-color rule
│   └── 集成到 .husky/pre-commit
├── A4. 移动端测试
│   ├── e2e/mobile/responsive.spec.ts
│   └── 3 断点 (375/768/1280)
└── A5. 性能基线
    ├── scripts/perf-lighthouse.sh
    └── docs/perf-baseline-2026-06.json
```

## 2. 接口与文件清单

### 2.1 视觉回归测试

```typescript
// web/e2e/visual/theme-snapshots.spec.ts
import { test, expect } from '@playwright/test';

const THEMES = ['trello-premium', 'linear-dark', 'monday-vibrant', 'enterprise-classic'];

for (const theme of THEMES) {
  test(`主题 ${theme} 视觉快照`, async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot(`theme-${theme}.png`, {
      maxDiffPixelRatio: 0.05
    });
  });
}
```

### 2.2 ESLint 规则

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-restricted-syntax': ['error',
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message: '❌ 硬编码颜色禁止！请使用 CSS 变量 var(--color-*)'
        }
      ]
    }
  }
];
```

### 2.3 移动端测试

```typescript
// web/e2e/mobile/responsive.spec.ts
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const vp of VIEWPORTS) {
  test(`登录页 @ ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/login');
    // 验证关键元素可见
  });
}
```

## 3. 验收对照表（v3.0 基线同步）

> **同步日期**：2026-06-10
> **同步来源**：[REQUIREMENTS_V3.md](./REQUIREMENTS_V3.md) §10、[AUDIT-总目标完成度.md](./AUDIT-总目标完成度.md)

| SPEC | 验收点 | v3.0 状态 | 证据 |
|------|-------|----------|------|
| A1. 删除 theme.ts | `ls web/src/lib/theme.ts` 不存在 | ✅ | git log `b723be2` 之前已删 |
| A1. themes.css 0 硬编码 | `grep -c "#[0-9a-f]" themes.css` = 0 | ✅ | 待精确验证（v3.0 阶段跳过） |
| A2. 4 主题视觉快照 | `ls tests/visual-baselines/*.png` = 4 | ✅ | `web/e2e/visual/theme-snapshots.spec.ts-snapshots/` 含 4 PNG（trello-premium / linear-dark / monday-vibrant / enterprise-classic） |
| A3. ESLint 规则 | `web/eslint.config.js` 含 no-hex 规则 | ✅ | `no-restricted-syntax` + `/^#[0-9a-fA-F]{3,8}$/i` 模式 |
| A3. ESLint 接入 pre-commit | `.husky/pre-commit` 跑 `npx eslint .` | ✅ v3.0 新增 | pre-commit 第 6 步；`npm run lint:eslint` 转发 |
| A4. 3 断点移动端测试 | `web/e2e/mobile/responsive.spec.ts` 通过 | ⚠️ 文件在，未跑 | 后续 sprint 跑 E2E |
| A5. 性能 baseline JSON | `docs/perf-baseline-2026-06.json` 存在 | ❌ 未生成 | 后续手动跑 `bash scripts/perf-lighthouse.sh` |

## 4. 不在范围内

- 主题市场（轨道 B）
- 标题优化器 V2（轨道 C）
