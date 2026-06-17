# 电商助手多维度主题系统 SPEC v2.0

> **方案选择**: B - 新主题包 + 配色微调器

---

## 1. 系统架构

```
Theme System v2.0
├── ThemePreset (主题包)
│   ├── visualStyle: 视觉风格
│   ├── density: 信息密度
│   ├── radius: 圆角系统
│   ├── spacing: 间距系统
│   ├── shadow: 阴影系统
│   └── motion: 动效系统
├── ColorScheme (配色方案)
│   ├── base: 基础色
│   ├── accent: 强调色
│   └── semantic: 语义色
└── UserOverrides (用户微调)
    └── 通过微调器覆盖任意CSS变量
```

---

## 2. 核心类型定义

```typescript
// 视觉风格
export type VisualStyle = 
  | 'trello'      // Trello风：扁平卡片、清爽布局
  | 'linear'       // Linear风：极简克制、深色优先
  | 'monday'       // Monday风：多彩活泼、渐变点缀
  | 'enterprise';  // 企业风：保守专业、蓝色主调

// 信息密度
export type Density = 'compact' | 'comfortable' | 'spacious';

// 圆角
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// 间距
export type Spacing = 'tight' | 'normal' | 'loose';

// 阴影
export type Shadow = 'none' | 'soft' | 'medium' | 'heavy' | 'glow';

// 动效
export type Motion = 'none' | 'subtle' | 'moderate' | 'playful';

// 主题包
export type ThemePreset = {
  id: string;
  name: string;
  visualStyle: VisualStyle;
  density: Density;
  radius: Radius;
  spacing: Spacing;
  shadow: Shadow;
  motion: Motion;
  colors: ColorScheme;
};

// 配色方案
export type ColorScheme = {
  primary: string;
  primaryFg: string;
  bg: string;
  surface: string;
  muted: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warn: string;
  danger: string;
};
```

---

## 3. 预设主题包

| ID | 名称 | VisualStyle | 用途 |
|----|------|-------------|------|
| `trello-premium` | Trello 高级风 | trello | ✅ 首选，流程管理 |
| `linear-dark` | Linear 极客风 | linear | 专业用户 |
| `monday-vibrant` | Monday 活力风 | monday | 创意团队 |
| `enterprise-classic` | 企业商务风 | enterprise | 企业环境 |

---

## 4. 配色微调器

用户可以在预设主题包基础上微调颜色：

```
┌────────────────────────────────────────────────────────┐
│  🎨 配色微调                                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│  主题包: [Trello 高级风 ▼]                              │
│                                                        │
│  ─────────────────────────────────────────────────    │
│                                                        │
│  主色调   ●────────────○  #0079BF                      │
│  背景色   ○──────●──────○  #F7F7F7                     │
│  文字色   ○──────────●──○  #172B4D                      │
│  边框色   ○──────●──────○  #DFE1E6                     │
│                                                        │
│  [ 重置为预设 ]  [ 恢复默认 ]                           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 5. CSS 变量架构

```css
/* 基础变量（所有主题共享） */
:root {
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 24px;
  
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}

/* Trello 预设 */
:root[data-preset='trello-premium'] {
  --color-primary: #0079BF;
  --color-bg: #F7F7F7;
  --color-surface: #FFFFFF;
  --color-text: #172B4D;
  --color-border: #DFE1E6;
  
  --radius-card: var(--radius-lg);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1);
}

/* Linear 预设 */
:root[data-preset='linear-dark'] {
  --color-primary: #5E6AD2;
  --color-bg: #0D0D0D;
  --color-surface: #1A1A1A;
  --color-text: #E5E5E5;
  --color-border: #2D2D2D;
  
  --radius-card: var(--radius-none);
  --shadow-card: 0 4px 12px rgba(0,0,0,0.5);
}
```

---

## 6. 组件适配规则

| 组件 | Trello | Linear | Monday | Enterprise |
|------|--------|--------|--------|------------|
| Card | 12px圆角 | 无圆角 | 24px圆角 | 4px圆角 |
| Button | 8px圆角 | 边框按钮 | 渐变背景 | 4px圆角 |
| Input | 8px圆角 | 无圆角 | 12px圆角 | 4px圆角 |
| Badge | 4px圆角 | 无圆角 | 12px圆角 | 2px圆角 |

---

## 7. 实施计划

| Phase | 内容 | 优先级 |
|-------|------|--------|
| Phase 0 | 类型系统 + 基础设施 | P0 |
| Phase 1 | Trello 高级风实现 | P0 |
| Phase 2 | 其他3个主题包 | P1 |
| Phase 3 | 配色微调器UI | P1 |
| Phase 4 | 插件端适配 | P2 |

---

## 8. 技术栈

- 布局组件: @hello-pangea/dnd (看板)
- 表格组件: TanStack Table
- 样式: CSS Variables + Tailwind
