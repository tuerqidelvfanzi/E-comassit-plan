# 产品品类设计 - 橱柜/吊灯/T恤

> 版本：v2.0 - 日期：2026-05-30

---

## 1. 橱柜品类

### 1.1 特征

| 特征 | 橱柜 |
|------|------|
| SKU模式 | C类（定制） |
| SKU数 | 1-5个（少规格） |
| 定制项 | 宽/深/高/材质/颜色 |
| 价格 | 按公式计算 |

### 1.2 SKU配置

```typescript
interface CabinetSkuConfig {
  mode: 'C';
  baseSku: {
    skuCode: string;
    name: string;
    price: number;
  };
  customFields: [
    { name: '宽度', code: 'width', type: 'range', min: 60, max: 240, unit: 'cm' },
    { name: '深度', code: 'depth', type: 'range', min: 30, max: 60, unit: 'cm' },
    { name: '高度', code: 'height', type: 'range', min: 180, max: 240, unit: 'cm' },
    { name: '材质', code: 'material', type: 'select', options: ['实木','颗粒板','多层板','不锈钢'] },
    { name: '颜色', code: 'color', type: 'select', options: ['白色','木色','灰色','黑色'] }
  ];
  addons: [
    { code: 'hinge', name: '缓冲铰链', price: 50 },
    { code: 'led', name: 'LED灯带', price: 80 },
    { code: 'handle', name: '隐形把手', price: 30 }
  ];
  priceFormula: 'base + width*5 + depth*3 + height*8';
}
```

### 1.3 系统Prompt - 橱柜

```
你是东南亚电商橱柜上品专家。

品类特征：
- 定制类产品
- 按尺寸计价
- 需要安装说明

处理规则：
- 生成尺寸选择表单
- 计算价格公式
- 提供安装指南
- 越南/泰国语

输出：定制表单配置、价格计算规则、安装说明
```

---

## 2. 吊灯品类

### 2.1 特征

| 特征 | 吊灯 |
|------|------|
| SKU模式 | B类（中规格） |
| SKU数 | 9-27个 |
| 变体维度 | 功率×色温×控制方式 |
| 规格参数 | 多 |

### 2.2 SKU配置

```typescript
interface LampSkuConfig {
  mode: 'B';
  dimensions: [
    {
      name: '功率',
      code: 'power',
      options: [
        { code: '24W', name: '24W', priceModifier: 0 },
        { code: '36W', name: '36W', priceModifier: 30 },
        { code: '48W', name: '48W', priceModifier: 60 }
      ]
    },
    {
      name: '色温',
      code: 'colorTemp',
      options: [
        { code: 'warm', name: '暖光 3000K', priceModifier: 0 },
        { code: 'cool', name: '白光 6000K', priceModifier: 0 },
        { code: 'natural', name: '自然光 4000K', priceModifier: 0 }
      ]
    },
    {
      name: '控制',
      code: 'control',
      options: [
        { code: 'switch', name: '开关', priceModifier: 0 },
        { code: 'remote', name: '遥控', priceModifier: 20 },
        { code: 'app', name: 'APP控制', priceModifier: 40 }
      ]
    }
  ];
  generateMode: 'matrix';
}
```

### 2.3 SKU矩阵

```
24W暖光开关   -> SKU001
24W暖光遥控   -> SKU002
24W暖光APP    -> SKU003
36W白光开关   -> SKU004
...
总计：3×3×3 = 27个SKU
```

### 2.4 系统Prompt - 吊灯

```
你是东南亚电商灯具上品专家。

品类特征：
- 配置组合多样
- 规格参数复杂
- 安装需说明

处理规则：
- 矩阵生成SKU
- 规格对比表
- 安装指南
- 场景效果图

越南站：标题≤120字符
泰国站：标题≤220字符，场景化

输出：规格对比表、所有SKU、安装说明
```

---

## 3. T恤品类

### 3.1 特征

| 特征 | T恤 |
|------|------|
| SKU模式 | A类（多规格） |
| SKU数 | 30-60个 |
| 变体维度 | 颜色×尺码×正反面 |
| 特殊 | 白色钩子 |

### 3.2 SKU配置

```typescript
interface TShirtSkuConfig {
  mode: 'A';
  colors: ['WH','BK','RD','BL','GR','PK','PU','OR','YL','GY'];
  sizes: ['S','M','L','XL','XXL','XXXL'];
  sides: ['P','R','PR'];
  sequenceStart: 1;
  prefix: string;
  dummyHook: {
    enabled: true,
    colorCode: 'WH',
    price: 400,
    stock: 5,
    weight: 220
  };
}
```

### 3.3 SKU生成

五段编码：{PREFIX}-{SEQ:4}-{SIDE}-{COLOR}-{SIZE}

示例：
- BF-0001-PR-WH-S（白色S码正反面）
- BF-9999-P-WH-M（白色钩子M码）

### 3.4 系统Prompt - T恤

```
你是东南亚电商T恤上品专家。

品类特征：
- 颜色×尺码矩阵
- SKU数量多
- 白色钩子处理

越南Shopee规则：
- 标题≤20字符
- 汉字压缩到9字
- 价格×3.5
- 库存50

泰国TikTok规则：
- 标题≤220字符
- 价格×2.5
- 主图≥5张
- 五段SKU编码

输出：越南站20字标题、SKU列表、违禁词警告
```

---

## 4. 品类对比

| 品类 | SKU模式 | SKU数 | 定制项 | 价格计算 |
|------|---------|-------|--------|----------|
| 橱柜 | C类定制 | 1-5 | 尺寸/材质/颜色 | 公式 |
| 吊灯 | B类中规格 | 9-27 | 功率/色温/控制 | 叠加 |
| T恤 | A类多规格 | 30-60 | 颜色/尺码/正反面 | 固定 |

---

## 5. 工厂模式

```typescript
const CategoryFactory = {
  // 服装类
  tshirt: TShirtFactory,
  men: MenFactory,
  women: WomenFactory,
  kids: KidsFactory,
  // 产品类
  cabinet: CabinetFactory,
  lamp: LampFactory,
};

function getFactory(category: string): CategoryFactory {
  return new CategoryFactory[category]();
}
```
