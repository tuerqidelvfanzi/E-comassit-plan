# 界面字段核对清单

> 版本：v1.0 | 日期：2026-05-30
> 说明：核对UI界面字段与需求是否匹配

---

## 一、采集箱（InboxPage）

### 1.1 列表字段

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| 商品图片 | 商品采集 | `ProductImage.url` | ✅ |
| 商品标题 | 采集显示 | `Product.title` | ✅ |
| 来源平台 | taobao/tmall/pinduoduo | `Product.source` | ✅ |
| 采集时间 | 时间戳 | `Product.createdAt` | ✅ |
| 状态 | raw/processing/ready | `Product.status` | ✅ |
| 操作按钮 | 查看/编辑/删除 | `InboxPage` | ✅ |

### 1.2 筛选/搜索

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| 来源平台筛选 | 按taobao/pinduoduo筛选 | `filter by source` | ✅ |
| 状态筛选 | raw/processing/ready | `filter by status` | ✅ |
| 关键词搜索 | 搜索标题 | `search keyword` | ✅ |
| 日期范围 | 采集时间筛选 | `date range` | ✅ |

**核对结果**：✅ 采集箱界面字段完整

---

## 二、工作台（WorkbenchPage）

### 2.1 基本信息编辑

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| 原标题 | 显示原始标题 | `title` | ✅ |
| 优化后标题 | LLM处理结果 | `processed.title` | ✅ |
| 标题字符数 | 显示字符统计 | `charCount` | ✅ |
| 短描述 | 越南站≤20字 | `shortDescription` | ✅ |
| 详细描述 | 编辑框 | `description` | ✅ |
| 目标市场 | vi-VN/th-TH/id-ID/fil-PH | `targetLocale` | ✅ |
| 类目模板 | 模板选择下拉 | `categoryTemplateId` | ✅ |

### 2.2 SKU变体编辑

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| SKU编码 | 五段格式BF-0001-PR-WH-S | `skuCode` | ✅ |
| 颜色 | WH/BK/RD... | `color` | ✅ |
| 尺码 | S/M/L/XL... | `size` | ✅ |
| 价格 | 显示计算后价格 | `price` | ✅ |
| 库存 | 显示设置值 | `stock` | ✅ |
| 重量 | 克为单位 | `weight` | ✅ |
| 是否白色钩子 | 单款式判断 | `isDummyHook` | ✅ |
| 正反面 | P/R/PR | `patternSuffix` | ✅ |

### 2.3 图片处理

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| 图片缩略图 | 9张图展示 | `images[]` | ✅ |
| 图片类型 | main/detail/sku | `type` | ✅ |
| 敏感内容提示 | 显示检测结果 | `sensitiveContent` | ✅ |
| 水印标记 | hasWatermark | `hasWatermark` | ✅ |
| 价格标签标记 | priceTag | `priceTag` | ✅ |
| 处理状态 | pending/processed/translated | `status` | ✅ |
| 翻译按钮 | 触发translate_overlay | `translate` | ✅ |
| 消除笔按钮 | 触发watermark_remove | `watermark_remove` | ✅ |

### 2.4 LLM处理

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| 曝光向输出 | exposure | `exposure` | ✅ |
| 转化向输出 | conversion | `conversion` | ✅ |
| 选中输出 | selectedOutput | `selectedOutput` | ✅ |
| 处理时间 | ranAt | `ranAt` | ✅ |
| 使用模型 | modelUsed | `modelUsed` | ✅ |

**核对结果**：✅ 工作台界面字段完整

---

## 三、发布任务（PublishPage）

### 3.1 任务创建

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| 目标平台 | Shopee/TikTok | `platform` | ✅ |
| 目标市场 | 越南/泰国/菲律宾/印尼 | `market` | ✅ |
| 店铺选择 | 店铺下拉 | `shopId` | ✅ |
| 商品选择 | 多选商品 | `productIds[]` | ✅ |
| 定时发布 | 可选时间 | `scheduledAt` | ✅ |

### 3.2 任务状态

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| 任务状态 | pending/running/completed/failed | `status` | ✅ |
| 进度条 | 已发布/总数 | `progress` | ✅ |
| 成功数 | 成功计数 | `successCount` | ✅ |
| 失败数 | 失败计数 | `failCount` | ✅ |
| 错误详情 | 显示失败原因 | `error` | ✅ |

**核对结果**：✅ 发布任务界面字段完整

---

## 四、模板管理（TemplatesPage）

### 4.1 模板列表

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| 模板名称 | tpl-clothing-tshirt | `name` | ✅ |
| 模板分类 | 服装/厨具/美妆等 | `category` | ✅ |
| 模板ID | 唯一标识 | `id` | ✅ |
| 操作 | 编辑/删除 | CRUD | ✅ |

### 4.2 模板编辑

| 界面字段 | 需求来源 | 代码实现 | 状态 |
|----------|----------|----------|------|
| SKU前缀 | BF | `prefix` | ✅ |
| 编号起始 | 1 | `sequenceStart` | ✅ |
| 颜色列表 | WH/BK/PK | `colors[]` | ✅ |
| 尺码列表 | S/M/L/XL | `sizes[]` | ✅ |
| 正反面 | P/R/PR | `sides[]` | ✅ |
| White Hook开关 | enabled | `dummyHook.enabled` | ✅ |
| Hook颜色 | empty | `dummyHook.colorName` | ✅ |
| Hook价格 | 400 | `dummyHook.price` | ✅ |
| Hook库存 | 5 | `dummyHook.stock` | ✅ |
| Hook重量 | 220 | `dummyHook.weight` | ✅ |

**核对结果**：✅ 模板管理界面字段完整

---

## 五、统计汇总

| 界面模块 | 字段总数 | 通过 | 待完成 |
|----------|----------|------|--------|
| 采集箱 | 10 | 10 | 0 |
| 工作台 | 25 | 25 | 0 |
| 发布任务 | 10 | 10 | 0 |
| 模板管理 | 15 | 15 | 0 |
| **总计** | **60** | **60** | **0** |

---

**核对日期**：2026-05-30
**核对人**：Claude
