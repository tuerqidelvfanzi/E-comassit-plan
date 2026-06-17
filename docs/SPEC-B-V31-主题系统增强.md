# SPEC-B: V3.1 主题系统增强

> **轨道**: B | **类型**: 主题市场 + 预览图 + 动画
> **创建日期**: 2026-06-02 | **状态**: 📐 SPEC 阶段

---

## 1. 架构

```
V3.1 主题增强
├── 1. 数据层
│   ├── types/theme-package.ts (新增)
│   └── lib/theme-storage.ts (新增)
├── 2. UI 组件
│   ├── components/theme/ThemePreview.tsx (新增)
│   ├── components/theme/ThemeMarketplace.tsx (新增)
│   ├── components/theme/ThemeImportExport.tsx (新增)
│   └── components/theme/ThemeTransition.tsx (新增)
├── 3. 动画
│   ├── CSS view-transitions
│   └── prefers-reduced-motion 支持
└── 4. 钩子
    ├── useThemeMarket() (新增)
    └── useThemeAnimation() (新增)
```

## 2. TypeScript 接口

```typescript
// web/src/types/theme-package.ts
export interface ThemePackage {
  id: string;            // UUID v4
  name: string;          // 1-50 字符
  author: string;        // 邮箱或昵称
  version: string;       // semver
  basePreset: string;    // 派生的预设 ID
  colors: ColorScheme;
  visualStyle: VisualStyle;
  density: Density;
  radius: Radius;
  spacing: Spacing;
  shadow: Shadow;
  motion: Motion;
  createdAt: number;     // 时间戳
  thumbnail?: string;    // base64 PNG
}

export interface ThemeMarket {
  presets: ThemePackage[];   // 内置
  userPresets: ThemePackage[]; // 用户自定义
  activeId: string;
}
```

## 3. 核心 API

```typescript
// web/src/lib/theme-storage.ts
export function exportTheme(theme: ThemePackage): Blob;
export function importTheme(json: string): ThemePackage;
export function saveUserTheme(theme: ThemePackage): void;
export function loadUserThemes(): ThemePackage[];
export function deleteUserTheme(id: string): void;
```

```typescript
// web/src/hooks/useThemeMarket.ts
export function useThemeMarket() {
  return {
    presets: ThemePackage[];          // 内置
    userPresets: ThemePackage[];      // 用户
    activeTheme: ThemePackage;
    setActiveTheme: (id: string) => void;
    exportCurrent: () => void;
    import: (file: File) => Promise<void>;
  };
}
```

## 4. UI 流程

### 4.1 主题市场
```
+----------------------------------+
| 🔍 搜索框      [筛选 ▾]          |
+----------------------------------+
| [预设主题] [我的主题] [导入]      |
+----------------------------------+
| 卡片 1  卡片 2  卡片 3  卡片 4   |
| 预览图  预览图  预览图  预览图   |
+----------------------------------+
```

### 4.2 预览图组件

```tsx
function ThemePreview({ theme }: { theme: ThemePackage }) {
  return (
    <div className="theme-preview" style={{
      '--color-primary': theme.colors.primary,
      '--color-bg': theme.colors.bg,
      // ...
    } as React.CSSProperties}>
      {/* 模拟页面布局的简化版 */}
      <div className="preview-header">...</div>
      <div className="preview-content">...</div>
    </div>
  );
}
```

### 4.3 动画切换

```tsx
function ThemeTransition({ children }: { children: ReactNode }) {
  if ('startViewTransition' in document) {
    return (
      <div onClick={(e) => {
        if (!e.target) return;
        (document as any).startViewTransition(() => {
          // 触发主题切换
        });
      }}>
        {children}
      </div>
    );
  }
  return <>{children}</>;
}
```

## 5. CSS 动画

```css
/* web/src/styles/theme-transition.css */
:root {
  --theme-transition-duration: 300ms;
}

body {
  transition:
    background-color var(--theme-transition-duration) ease,
    color var(--theme-transition-duration) ease;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --theme-transition-duration: 0ms;
  }
}

/* View Transitions API 支持 */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: var(--theme-transition-duration);
}
```

## 6. 验收对照表（v3.0 基线同步）

> **同步日期**：2026-06-10
> **同步来源**：[REQUIREMENTS_V3.md](./REQUIREMENTS_V3.md) §10.1 + `web/src/components/theme/`

| SPEC | 验收点 | v3.0 状态 | 证据 |
|------|-------|----------|------|
| ThemePackage 类型 | `web/src/types/theme-package.ts` 定义 | ✅ | type-check 通过 |
| import/export | `web/src/lib/theme-storage.ts` 1.5 KB | ✅ | `theme-storage.test.ts` 通过 |
| 4 内置主题 | 主题市场展示 4 卡片 | ✅ | `useThemeMarket.ts` + `ThemeMarketplace.tsx` |
| 用户主题持久化 | 刷新后保留 | ✅ | `localStorage` + `loadUserThemes()` |
| 动画 300ms | DevTools 性能 | ✅ | `ThemeTransition.tsx` + `useThemeAnimation.ts` |
| 降级无动画 | prefers-reduced-motion | ✅ | `theme-transition.css` 媒体查询 |
| 预览图组件 | 4 主题卡片 | ✅ | `ThemePreview.tsx` |
| **路由可访问** | `/app/settings/themes/market` | ✅ v3.0 已修 | `web/src/App.tsx` Route 60 行 |

## 7. 不在范围内

- 评分算法（轨道 C）
- 主题评分/评论
