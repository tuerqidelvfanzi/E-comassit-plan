# 服装品类设计 - 男装/女装/童装

> 版本：v2.0 - 日期：2026-05-30

---

## 1. 品类工厂模式

```
CategoryFactory (基类)
    ├── MenCategoryFactory (男装)
    ├── WomenCategoryFactory (女装)
    └── KidsCategoryFactory (童装)
```

---

## 2. 男装品类

### 2.1 特征

| 特征 | 男装 |
|------|------|
| 尺码 | S/M/L/XL/XXL |
| 颜色 | 黑白灰蓝卡其军绿 |
| 风格 | 简约商务休闲 |
| SKU数 | 25-30个 |

### 2.2 SKU配置

- 颜色：白/黑/灰/蓝/卡其/军绿
- 尺码：S/M/L/XL/XXL
- 正反面：P/R/PR

### 2.3 标题规则

越南站：简洁商务，关键词（nam/basic/cotton）
泰国站：年轻商务，关键词（ผู้ชาย/แฟชั่น/สบาย）

---

## 3. 女装品类

### 3.1 特征

| 特征 | 女装 |
|------|------|
| 尺码 | XS/S/M/L/XL（偏小） |
| 颜色 | 白黑粉蓝紫红黄绿橙 |
| 风格 | 时尚甜美韩风 |
| SKU数 | 35-45个 |

### 3.2 SKU配置

- 颜色：白/黑/粉/蓝/紫/红/黄/绿/橙
- 尺码：XS/S/M/L/XL
- 正反面：P/R/PR

### 3.3 标题规则

越南站：时尚甜美，可使用emoji，关键词（xinh/thời trang）
泰国站：时尚年轻，必须emoji，关键词（ผู้หญิง/สวย/แฟชั่น）

---

## 4. 童装品类

### 4.1 特征

| 特征 | 童装 |
|------|------|
| 尺码 | 按年龄段（52-160） |
| 颜色 | 明亮多彩 |
| 风格 | 可爱舒适安全 |
| 特殊 | A类面料无荧光剂 |

### 4.2 年龄段

- 0-2岁：52/59/66/73/80
- 1-3岁：80/90/100/110
- 3-6岁：100/110/120/130
- 6-12岁：130/140/150/160

### 4.3 标题规则

越南站：必须提年龄段，可爱词汇（bé/ngộ nghĩnh）
泰国站：必须提年龄段，必须emoji（👦👧🌈）

---

## 5. 工厂模式接口

```typescript
interface CategoryFactory {
  createCategory(): CategoryConfig;
  createSkuConfig(): SkuConfig;
  createTitleRules(): TitleRules;
  createSystemPrompt(): SystemPrompt;
}

// 使用示例
const factory = getCategoryFactory('kids');
const config = factory.createCategory();
```

---

## 6. 品类对比

| 项目 | 男装 | 女装 | 童装 |
|------|------|------|------|
| 尺码 | S-XXL | XS-XL | 按年龄 |
| 颜色 | 5-6种 | 7-9种 | 5-7种 |
| Emoji | 可选 | 推荐 | 必须 |
| 面料要求 | 中等 | 中等 | 严格A类 |
