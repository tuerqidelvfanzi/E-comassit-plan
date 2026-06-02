# 电商助手多维度主题系统 SPEC

## 1. 概念定义

### 1.1 旧认知 vs 新认知

| 维度 | 旧认知（仅视觉） | 新认知（系统级） |
|------|------------------|------------------|
| **配色** | 颜色值 | 语义化色彩系统 |
| **布局** | 无 | 看板/表格/列表/画廊 |
| **视觉风格** | 无 | 扁平/Material/玻璃拟态/极简 |
| **信息密度** | 无 | 紧凑/舒适/宽松 |
| **圆角系统** | 无 | 微圆角/标准/大圆角 |
| **间距系统** | 无 | 紧凑/标准/宽松 |
| **阴影系统** | 无 | 无/轻阴影/重阴影/霓虹光晕 |
| **交互模式** | 无 | 点击优先/拖拽优先/键盘优先 |

### 1.2 Theme 系统架构

```
Theme System
├── PresetTheme (预设主题包)
│   ├── colors: 配色方案
│   ├── layout: 布局模式
│   ├── visualStyle: 视觉风格
│   ├── density: 信息密度
│   ├── radius: 圆角系统
│   ├── spacing: 间距系统
│   ├── shadow: 阴影系统
│   └── motion: 动效系统
├── CustomCSS (自定义扩展)
└── UserOverrides (用户偏好覆盖)
```

---

## 2. 维度详解

### 2.1 布局模式 (Layout)

| ID | 名称 | 描述 | 适用场景 |
|----|------|------|----------|
| `kanban` | 看板 | 列卡片拖拽 | 选品流程、发布队列 |
| `table` | 表格 | 数据密集展示 | 采集箱、规则库 |
| `list` | 列表 | 层级文档 | 设置、模板列表 |
| `gallery` | 画廊 | 卡片网格 | 商品图片浏览 |
| `timeline` | 时间轴 | 时间线视图 | 发布计划 |
| `mixed` | 混合 | 多视图切换 | 工作台 |

### 2.2 视觉风格 (Visual Style)

| ID | 名称 | 描述 | 特点 |
|----|------|------|------|
| `trello` | Trello风 | 扁平卡片、清爽布局 | 大圆角、轻阴影、活泼蓝 |
| `monday` | Monday风 | 多彩标签、渐变点缀 | 彩虹色、大圆角、微动效 |
| `linear` | Linear风 | 极简克制、深色优先 | 无圆角、重阴影、键盘优先 |
| `notion` | Notion风 | 文档感、温暖排版 | 中等圆角、衬线点缀 |
| `slack` | Slack风 | 消息流、轻量交互 | 微圆角、头像突出 |
| `enterprise` | 企业风 | 保守专业、蓝色主调 | 小圆角、表格密集 |
| `cyberpunk` | 赛博朋克 | 霓虹光效、科技感 | 边框发光、深色背景 |

### 2.3 信息密度 (Density)

| ID | 名称 | 描述 |
|----|------|------|
| `compact` | 紧凑 | 适合数据密集场景（表格、多字段） |
| `comfortable` | 舒适 | 默认值，适合大多数场景 |
| `spacious` | 宽松 | 适合展示型、强调单卡片内容 |

### 2.4 圆角系统 (Radius)

| ID | 名称 | 值 | 效果 |
|----|------|-----|------|
| `none` | 无 | 0px | 硬朗、工程师感 |
| `sm` | 微圆角 | 4px | 专业、克制 |
| `md` | 标准 | 8px | 平衡、大众 |
| `lg` | 大圆角 | 16px | 活泼、年轻 |
| `xl` | 超大 | 24px+ | 柔和、梦幻 |

### 2.5 间距系统 (Spacing)

| ID | 名称 | 基准值 |
|----|------|--------|
| `tight` | 紧凑 | 4px |
| `normal` | 标准 | 8px |
| `loose` | 宽松 | 16px |

### 2.6 阴影系统 (Shadow)

| ID | 名称 | 描述 |
|----|------|------|
| `none` | 无 | 扁平设计 |
| `soft` | 轻阴影 | 微妙的层次感 |
| `medium` | 中阴影 | 明显的层次感 |
| `heavy` | 重阴影 | 卡片浮起感 |
| `glow` | 霓虹光晕 | 赛博朋克效果 |

### 2.7 动效系统 (Motion)

| ID | 名称 | 描述 |
|----|------|------|
| `none` | 无动效 | 极简、性能优先 |
| `subtle` | 微动效 | 过渡动画 |
| `moderate` | 中等动效 | 卡片展开/收起 |
| `playful` | 活泼动效 | 弹性动画、反馈丰富 |

---

## 3. 预设主题包

### 3.1 Trello 高级风 (trello-premium)

```typescript
{
  id: 'trello-premium',
  name: 'Trello 高级风',
  description: '扁平卡片、清爽布局，适合流程管理',
  
  // 配色 - 清新蓝白
  colors: {
    primary: '#0079BF',
    bg: '#F7F7F7',
    surface: '#FFFFFF',
    text: '#172B4D',
    border: '#DFE1E6',
  },
  
  // 布局
  layout: 'mixed', // 工作台混合，其他页面看板
  
  // 视觉
  visualStyle: 'trello',
  
  // 密度
  density: 'comfortable',
  
  // 圆角
  radius: 'lg', // 8-12px
  
  // 阴影
  shadow: 'soft',
  
  // 间距
  spacing: 'normal',
  
  // 动效
  motion: 'moderate',
}
```

### 3.2 Linear 极客风 (linear-dark)

```typescript
{
  id: 'linear-dark',
  name: 'Linear 极客风',
  description: '极简克制、深色优先，适合专业用户',
  
  colors: {
    primary: '#5E6AD2',
    bg: '#0D0D0D',
    surface: '#1A1A1A',
    text: '#E5E5E5',
    border: '#2D2D2D',
  },
  
  layout: 'mixed',
  visualStyle: 'linear',
  density: 'compact',
  radius: 'none',
  shadow: 'heavy',
  spacing: 'tight',
  motion: 'subtle',
}
```

### 3.3 Monday 活力风 (monday-vibrant)

```typescript
{
  id: 'monday-vibrant',
  name: 'Monday 活力风',
  description: '多彩标签、渐变点缀，适合创意团队',
  
  colors: {
    primary: '#FF3D57',
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    border: '#E6E6E6',
  },
  
  layout: 'mixed',
  visualStyle: 'monday',
  density: 'comfortable',
  radius: 'xl',
  shadow: 'medium',
  spacing: 'loose',
  motion: 'playful',
}
```

### 3.4 企业商务风 (enterprise-classic)

```typescript
{
  id: 'enterprise-classic',
  name: '企业商务风',
  description: '保守专业、蓝色主调，适合企业环境',
  
  colors: {
    primary: '#1E40AF',
    bg: '#F1F5F9',
    surface: '#FFFFFF',
    text: '#1E293B',
    border: '#E2E8F0',
  },
  
  layout: 'table', // 表格优先
  visualStyle: 'enterprise',
  density: 'compact',
  radius: 'sm',
  shadow: 'none',
  spacing: 'tight',
  motion: 'none',
}
```

---

## 4. 组件适配规则

### 4.1 卡片组件

| 视觉风格 | 卡片样式 |
|----------|----------|
| trello | 白色卡片、8px圆角、轻阴影 |
| linear | 深色卡片、无圆角、重阴影 |
| monday | 白色卡片、16px圆角、中等阴影 |
| enterprise | 白色卡片、4px圆角、无阴影 |

### 4.2 按钮组件

| 视觉风格 | 按钮样式 |
|----------|----------|
| trello | 蓝色实心、8px圆角 |
| linear | 边框按钮、无圆角 |
| monday | 渐变背景、24px圆角 |
| enterprise | 蓝色实心、4px圆角 |

### 4.3 列表项

| 密度 | 行高 | 内边距 |
|------|------|--------|
| compact | 32px | 8px 12px |
| comfortable | 44px | 12px 16px |
| spacious | 56px | 16px 20px |

---

## 5. 实现计划

### Phase 1: 基础设施重构
- [ ] 重构 theme.ts 支持多维度
- [ ] 创建 VisualStyleSystem
- [ ] 更新 CSS 变量架构

### Phase 2: Trello 风格实现
- [ ] 实现 trello-premium 主题
- [ ] 适配卡片组件
- [ ] 实现看板布局

### Phase 3: 其他风格实现
- [ ] linear-dark 主题
- [ ] monday-vibrant 主题
- [ ] enterprise-classic 主题

### Phase 4: 插件端适配
- [ ] 插件端主题系统
- [ ] 主题同步机制

---

## 6. 技术实现

### 6.1 CSS 变量架构

```css
:root[data-preset='trello-premium'] {
  /* 配色 */
  --color-primary: #0079BF;
  --color-bg: #F7F7F7;
  --color-surface: #FFFFFF;
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* 阴影 */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1);
  
  /* 间距 */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  
  /* 动效 */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

### 6.2 组件 class 映射

```tsx
// 使用语义化 class
<Card className="surface-card kanban-card" />

// 对应 CSS
.surface-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
```
