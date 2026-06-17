# 类目模板设计 v2.0 — 品类SKU模式

> 版本：v2.0 · 日期：2026-05-30  
> 说明：基于需求v2.0，细化各类目SKU模式设计

---

## 1. SKU模式分类

根据商品SKU复杂度，将品类分为三类：

| 模式 | 类型 | SKU数量 | 变体维度 | 代表商品 |
|------|------|----------|----------|----------|
| A类 | 多规格服装 | 15-60个 | 颜色×尺码 | 儿童服装、T恤、裤子 |
| B类 | 中规格产品 | 3-15个 | 配置选项 | 吊灯、小家电、收纳盒 |
| C类 | 少规格/定制 | 1-5个 | 定制参数 | 橱柜、商用设备、定制礼品 |

---

## 2. A类：多规格服装

### 2.1 特征分析

**SKU结构**：颜色 × 尺码 = SKU矩阵

**典型商品**：
- 儿童服装：5色×6码 = 30个SKU
- T恤：5色×6码 = 30个SKU
- 裤子：4色×5码 = 20个SKU

### 2.2 SKU配置

```typescript
interface ClothingSkuConfig {
  mode: 'A';
  colors: Array<{ code: string; name: string; enabled: boolean }>;
  sizes: Array<{ code: string; name: string; enabled: boolean }>;
  sides: Array<'P' | 'R' | 'PR'>;
  sequenceStart: number;
  prefix: string;
  dummyHook: {
    enabled: boolean;
    price: number;  // 400
    stock: number;  // 5
    weight: number; // 220g
  };
}
```

### 2.3 SKU生成算法

格式：`{PREFIX}-{SEQUENCE:4}-{SIDE}-{COLOR}-{SIZE}`

示例：`BF-0001-PR-WH-S` (白色S码，正反面图案)

白色钩子：`BF-9999-P-WH-{SIZE}` (价格400/库存5/重量220g)

---

## 3. B类：中规格产品

### 3.1 特征分析

**SKU结构**：配置选项组合

**典型商品**：
- 吊灯：3功率×3色温 = 9个SKU
- 小家电：3颜色×2容量 = 6个SKU

### 3.2 SKU配置

```typescript
interface VariantSkuConfig {
  mode: 'B';
  dimensions: Array<{
    name: string;
    code: string;
    options: Array<{
      code: string;
      name: string;
      priceModifier: number;
      enabled: boolean;
    }>;
  }>;
  generateMode: 'matrix' | 'manual';
}
```

### 3.3 SKU生成算法

矩阵模式：笛卡尔积生成所有组合

手动模式：用户指定SKU列表

---

## 4. C类：少规格/定制

### 4.1 特征分析

**SKU结构**：基础SKU + 定制参数

**典型商品**：
- 橱柜：按尺寸定制
- 商用设备：基础+选配

### 4.2 SKU配置

```typescript
interface CustomSkuConfig {
  mode: 'C';
  baseSku: { skuCode: string; name: string; price: number; stock: number };
  customFields: Array<{
    name: string;
    code: string;
    type: 'text' | 'number' | 'select' | 'range';
    required: boolean;
    unit?: string;
    min?: number;
    max?: number;
    options?: string[];
  }>;
  addons: Array<{ code: string; name: string; price: number }>;
  priceRule: 'fixed' | 'formula';
  priceFormula?: string;
}
```

---

## 5. 模板系统Prompt设计

### 5.1 A类服装Prompt要点

1. 品类特征：多颜色多尺码矩阵
2. 越南规则：标题≤20字，×3.5倍
3. 泰国规则：年轻化标题，×2.5倍
4. 五段SKU编码

### 5.2 B类灯具Prompt要点

1. 配置组合生成SKU
2. 规格参数清晰展示
3. 安装说明必不可少

### 5.3 C类定制Prompt要点

1. 基础SKU + 加配项
2. 定制参数表单
3. 价格计算公式
4. 咨询引导话术

---

## 6. 实现路径

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| Phase 1 | A类服装模板完善 | P0 |
| Phase 2 | B类产品模板扩展 | P1 |
| Phase 3 | C类定制模板 | P2 |

---

*文档结束*
