# RES-B: 主题市场技术方案

> **轨道**: B | **目标**: 主题导入导出 + 预览图

---

## 1. 主题包 JSON Schema

参考 VSCode Theme JSON、Warp Terminal Theme：
- 必填字段：id, name, version, colors
- 选填：author, thumbnail, description

```json
{
  "$schema": "https://e-com-assist.com/schemas/theme-v1.json",
  "id": "uuid-here",
  "name": "Ocean Breeze",
  "version": "1.0.0",
  "author": "user@example.com",
  "basePreset": "trello-premium",
  "colors": {
    "primary": "#0ea5e9",
    "primaryFg": "#ffffff",
    ...
  },
  "visualStyle": "trello",
  "density": "comfortable",
  "radius": "lg",
  "spacing": "normal",
  "shadow": "medium",
  "motion": "subtle"
}
```

## 2. 预览图方案

| 方案 | 优 | 劣 |
|------|---|---|
| **CSS 渲染 SVG** | 矢量、可缩放、文件小 | 复杂布局难 |
| **Puppeteer 截图** | 真实感 | 需 Chromium |
| **手工设计** | 最美 | 耗时 |
| **CSS 卡片合成** | 轻量、即时 | 简化版 |

**选型**: **CSS 卡片合成 + 截图**（运行时生成）

## 3. 动画方案

```css
:root {
  --theme-transition: background 0.3s ease,
                       color 0.3s ease,
                       border 0.3s ease;
}

* {
  transition: var(--theme-transition);
}
```

**关键技术**:
- `View Transitions API` (Chrome 111+) - 原生主题切换动画
- `@starting-style` (新特性) - 元素入场动画
- **降级方案**: CSS transition

**选型**: **CSS transition + View Transitions（渐进增强）** ✅

## 4. localStorage 主题持久化

```typescript
const STORAGE_KEY = 'ecom-theme-user-presets';

interface Storage {
  presets: ThemePackage[];
  activeId: string;
}

function loadStorage(): Storage {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}
```

## 5. 结论

技术栈零新增：纯 JSON + localStorage + CSS transitions。
