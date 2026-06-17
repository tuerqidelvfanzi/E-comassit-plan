# RES-A: 测试基础设施对比

> **轨道**: A | **目标**: 为 V3.0 收尾挑选最佳测试库

---

## 1. 视觉回归测试对比

| 库 | Stars | 学习曲线 | 维护 | 特点 |
|---|-------|---------|------|------|
| **Playwright (内置)** | 67k+ | 中 | ✅ 微软 | 已有，无额外依赖 |
| Percy | 4.5k | 低 | ✅ BrowserStack | 商业 SaaS |
| Chromatic | 1.5k | 低 | ✅ Storybook | Storybook 集成 |
| BackstopJS | 6.5k | 中 | ⚠️ 慢 | 仅 CSS 截图 |
| reg-suit | 1k | 高 | ⚠️ 维护少 | 需 GitHub Storage |

**选型**: **Playwright `toHaveScreenshot()`** (内置) ✅

## 2. ESLint 禁止硬编码颜色

| 方案 | 实现 | 优 |
|------|------|---|
| **eslint-plugin-css-vars** | 简单 | ⚠️ 需配置白名单 |
| **自定义 no-hex rule** | 5 行代码 | ✅ 完全可控 |
| **Stylelint** | 标准方案 | 需多一个工具链 |

**选型**: **自定义 no-restricted-syntax rule** ✅

```javascript
// .eslintrc.cjs
rules: {
  'no-restricted-syntax': ['error',
    { selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
      message: "硬编码颜色禁止！请使用 CSS 变量 var(--color-*)" }
  ]
}
```

## 3. 移动端测试

| 库 | 方案 |
|---|------|
| **Playwright (内置)** | `viewport: { width: 375 }` + 多断点循环 |
| BrowserStack | 商业 |
| Saucelabs | 商业 |

**选型**: **Playwright 项目模式** ✅

## 4. 性能基线

| 工具 | 指标 |
|------|------|
| **Playwright Performance** | FCP, LCP, TTI |
| **Lighthouse CLI** | 综合评分 |
| **web-vitals** | 真实用户监控 |

**选型**: **Lighthouse + Playwright 性能 API** ✅

## 5. 结论

全部使用 Playwright + ESLint（无新增依赖），与项目现有栈一致。
