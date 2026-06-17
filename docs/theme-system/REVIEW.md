# 主题系统 SPEC 第三方审查报告

**审查时间**: 2026-06-02  
**审查方法**: 代码审查 + 设计对比

---

## 1. 发现的问题

### 1.1 架构级问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 48种配色与新系统不兼容 | 🔴 高 | 现有48个独立主题无法映射到新的多维度系统 |
| SPEC定义的4个预设包数量不足 | 🟡 中 | 应增加"电商专用风"，覆盖商品/SKU/标题等元素 |
| 布局模式(kanban/table)无组件支持 | 🔴 高 | SPEC写了但代码没实现，是空头支票 |
| 插件端设计缺失 | 🟡 中 | 只提到"同步机制"，无具体设计 |

### 1.2 类型定义缺失

```typescript
// ❌ 缺失的类型
export type VisualStyle = 'trello' | 'monday' | 'linear' | 'notion' | 'slack' | 'enterprise' | 'cyberpunk';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type Spacing = 'tight' | 'normal' | 'loose';
export type Shadow = 'none' | 'soft' | 'medium' | 'heavy' | 'glow';
export type Motion = 'none' | 'subtle' | 'moderate' | 'playful';
export type Layout = 'kanban' | 'table' | 'list' | 'gallery' | 'timeline' | 'mixed';

// ✅ 缺失的复合类型
export type ThemePreset = {
  id: string;
  name: string;
  colors: ColorScheme;
  layout: Layout;
  visualStyle: VisualStyle;
  density: Density;
  radius: Radius;
  spacing: Spacing;
  shadow: Shadow;
  motion: Motion;
};
```

### 1.3 CSS 变量命名不一致

| 现有命名 | 问题 |
|----------|------|
| `--color-text-muted` | 某些主题用这个 |
| `--color-text-2` | theme.ts 中的 DEFAULT_CUSTOM_CSS 用这个 |
| `--color-bg-soft` | 命名不规范 |

**建议**: 统一使用 `--color-{role}-{level}` 格式

### 1.4 组件适配规则不完整

| 组件 | 缺失规则 |
|------|----------|
| Input | 无边框/圆角/聚焦色规则 |
| Table | 无行高/单元格padding规则 |
| Badge | 无各visualStyle的样式映射 |
| Tag/Label | 无多彩标签支持（如Monday的彩虹标签） |
| Tabs | 无选中/未选中样式规则 |
| Modal/Dialog | 无遮罩/动画规则 |
| Toast/Notification | 无位置/动效规则 |

---

## 2. 修正建议

### 2.1 预设主题包扩展

| 主题包 | VisualStyle | 用途 |
|--------|-------------|------|
| Trello 高级风 | trello | ✅ 你的首选 |
| Linear 极客风 | linear | 专业用户 |
| Monday 活力风 | monday | 创意团队 |
| 电商专业风 | enterprise | ⚠️ **新增**：商品/SKU/标题专用 |
| 赛博朋克风 | cyberpunk | 极客用户 |

### 2.2 电商专业风的特殊要求

```typescript
{
  id: 'ecom-pro',
  name: '电商专业风',
  visualStyle: 'enterprise',
  // 额外维度
  productCard: 'compact',    // 商品卡片密度
  skuTable: 'compact',       // SKU表格密度
  titleEditor: 'spacious',   // 标题编辑器宽松
  imageGallery: 'comfortable', // 图片画廊舒适
}
```

### 2.3 实施顺序建议

```
Phase 0: 类型系统重构
├── 定义所有枚举类型
├── 定义 ThemePreset 接口
├── 定义 CSS 变量规范
└── 统一命名规范

Phase 1: 基础设施
├── 重构 theme.ts
├── 创建 styles/presets/*.css
└── 创建组件适配层

Phase 2: Trello 风实现
└── 完整实现 + 组件适配

Phase 3: 其他风格
└── Linear + Monday + 企业风

Phase 4: 插件端
└── 主题同步机制
```

---

## 3. 结论

| 评估项 | 评分 | 说明 |
|--------|------|------|
| 设计完整性 | 7/10 | 维度全面，但缺少组件级规则 |
| 实现可行性 | 5/10 | 与现有系统差距大，需大规模重构 |
| 可维护性 | 6/10 | 类型定义缺失会影响长期维护 |
| 实用性 | 8/10 | 4个预设包 + 自由定制很实用 |

**总体建议**: 
1. **暂停当前实现**，先完善 SPEC
2. **增加电商专用风**作为第5个预设包
3. **补充组件级适配规则**
4. **Phase 0 必须先完成类型系统重构**

---

## 4. 待确认问题

- [ ] 48种旧配色是否需要保留（向后兼容）？
- [ ] 布局模式(看板/表格)是否需要在Phase1实现？
- [ ] 插件端主题同步的具体机制？
