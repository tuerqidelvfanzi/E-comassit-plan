# 代码追溯表

> 版本：v1.0 | 日期：2026-05-30
> 说明：从代码文件追溯到需求ID的对应关系

---

## 一、核心业务模块

### 1.1 listing.ts (领域入口)

| 代码 | 需求来源 | 状态 |
|------|----------|------|
| `export * from './listing/status.js'` | 商品状态管理 | ✅ |
| `export * from './listing/skuEncoder.js'` | BRD §4.2 SKU编码 | ✅ |
| `export * from './listing/antiBan.js'` | BRD §8 防封检查 | ✅ |
| `export * from './listing/tiktokDefaults.js'` | BRD §4 TikTok默认 | ✅ |
| `export * from './listing/marketPricing.js'` | BRD §7 定价规则 | ✅ |
| `export * from './listing/titleRules.js'` | BRD §3.2 标题规则 | ✅ |
| `export * from './listing/imageRules.js'` | BRD §3.4 图片规则 | ✅ |
| `export * from './listing/contracts.js'` | Phase2 集成契约 | ✅ |
| `export * from './listing/productFilters.js'` | EXT-1 选品筛选 | ✅ |
| `export * from './listing/categoryTemplates.js'` | BRD §6 类目模板 | ✅ |

---

## 二、SKU编码模块 (skuEncoder.ts)

| 代码函数/常量 | 需求对应 | 示例 |
|--------------|----------|------|
| `SKU_DEFAULT_PREFIX = 'BF'` | BRD §4.2 店铺前缀 | BF-0001 |
| `COLOR_CODES` | BRD §4.3 颜色表 | WH/BK/RD |
| `PATTERN_SIDES` | BRD §4.2 正反面 | P/R/PR |
| `encodeSku(input)` | BRD §4.2 五段编码 | BF-0001-PR-WH-S |
| `encodeDummyHookSku()` | BRD §4.4 白色钩子 | BF-9999-P-WH-S |
| `parseSku(code)` | SKU解析 | - |
| `formatSequence(n)` | 4位序号 | 0001 |
| `resolveColorCode(color)` | 颜色→编码 | 白色→WH |

---

## 三、类目模板模块 (categoryTemplates.ts)

| 代码 | 需求对应 | 值 |
|------|----------|---|
| `CATEGORY_TEMPLATES['tpl-clothing-tshirt']` | BRD §6.1 | 服装-T恤 |
| `skuConfig.prefix = 'BF'` | BRD §6.2 | BF |
| `skuConfig.colors` | BRD §6.2 | ['WH','BK','PK'] |
| `skuConfig.sizes` | BRD §6.2 | ['S','M','L','XL','XXL','XXXL'] |
| `dummyHook.price = 400` | BRD §4.4 | 400 |
| `dummyHook.stock = 5` | BRD §4.4 | 5 |
| `dummyHook.weight = 220` | BRD §4.4 | 220 |
| `SHOPEE_VN_TEMPLATE_OVERRIDES` | BRD §6.3 | ×3.5, ≤20字 |
| `getCategoryTemplate(id)` | 模板获取 | - |

---

## 四、标题规则模块 (titleRules.ts)

| 代码 | 需求对应 | 值 |
|------|----------|---|
| `VIETNAM_TITLE_MAX = 20` | BRD §3.2 | 20字符 |
| `VIETNAM_CJK_RECOMMENDED_MAX = 10` | BRD §3.2 | 10汉字 |
| `validateTitle(title)` | BRD §3.2 | 返回验证结果 |
| `countTitleChars(title)` | 字符统计 | - |
| `countCjkChars(title)` | 汉字统计 | - |
| `truncateTitle(title, maxChars)` | 截断函数 | - |

---

## 五、图片规则模块 (imageRules.ts)

| 代码 | 需求对应 | 值 |
|------|----------|---|
| `SHOPEE_VN_IMAGE_COUNT = 9` | BRD §3.4 | 9张 |
| `TIKTOK_TH_MAIN_IMAGE_MIN = 5` | BRD §4.1 | 5张 |
| `IMAGE_SQUARE_SIZE = 800` | BRD §3.4 | 800px |
| `KEEP_IMAGE_TYPES` | BRD §3.4 | 5种类型 |
| `SENSITIVE_IMAGE_KEYWORDS` | BRD §8.1 | 11种敏感词 |
| `validateImageSet(count, platform)` | BRD §3.4 | 验证图片数 |
| `scanSensitiveContent(text)` | BRD §8.1 | 扫描敏感词 |

---

## 六、防封模块 (antiBan.ts)

| 代码 | 需求对应 |
|------|----------|
| `MaterialKind` | 面料类型 cotton/polyester |
| `detectMaterial(text)` | BRD §6 面料检测 |
| `scanBannedTerms(text)` | BRD §8.2 违禁词 |
| `BANNED_TERMS` | BRD §8.2 品牌词+国内标识 |
| `scanAntiBan(source, listing)` | BRD §6 面料一致性 |
| `validateMaterialConsistency()` | BRD §6 防封验证 |

**违禁词清单**：
```
耐克/Nike, 阿迪达斯/Adidas, 迪士尼/Disney, LV, Gucci, Chanel, 爱马仕,
苹果/Apple, 三星/Samsung, 华为/Huawei, NASA,
3C认证, 产地, 发货地, 最便宜, 全网最低, 绝对, 100%正品
```

---

## 七、定价规则模块 (marketPricing.ts)

| 代码 | 需求对应 |
|------|----------|
| `MARKET_PRICING_RULES['vn-shopee']` | BRD §7.1 越南×3.5 |
| `MARKET_PRICING_RULES['th-tiktok']` | BRD §7.1 泰国×2.5 |
| `MARKET_PRICING_RULES['ph-shopee']` | BRD §7.1 菲律宾固定500 |
| `calcListPrice(cost, market)` | BRD §7.1 价格计算 |
| `getDefaultStock(market)` | BRD §7.2 库存 |
| `getDefaultWeightGrams(market)` | BRD §7.3 重量 |

**市场配置**：
```
vn-shopee: multiplier=3.5, stock=50, weight=220g, titleMax=20
th-tiktok: multiplier=2.5, stock=50, weight=220g
ph-shopee: fixedPrice=500, stock=800, weight=220g
id-shopee: multiplier=3.5, stock=50, weight=220g, titleMax=20
```

---

## 八、契约模块 (contracts.ts)

| 代码 | 需求对应 |
|------|----------|
| `LinkCatcherEntry` | EXT-2 Redis链接捕获 |
| `LinkCatcherEnqueueRequest` | EXT-2 队列请求 |
| `AdsPowerProfile` | EXT-3 ADS Power指纹 |
| `evaluateAdsPowerGate()` | EXT-3 浏览器gate |
| `AiImagePipelineConfig` | EXT-4 AI图片配置 |
| `DEFAULT_AI_IMAGE_CONFIG` | EXT-4 默认配置 |
| `AI_OPERATION_TO_JOB` | P1 图片操作映射 |
| `BillingHook` | EXT-5 计费挂钩 |
| `estimateTokenCost()` | EXT-5 成本估算 |

---

## 九、流水线模块 (pipeline/engine.ts)

| 代码 | 需求对应 | 状态 |
|------|----------|------|
| `ProcessRequest` | BRD-1.3 LLM处理 | ⚠️ planned |
| `ProcessedResult` | BRD-5.4 双指标 | ⚠️ planned |
| `ProcessedOutput` | BRD-5.5 短描述/字符数 | ✅ |
| `processWithLLM()` | BRD-1.3 本地化 | ⚠️ planned |
| `selectBestOutput()` | 输出选择 | ⚠️ planned |

---

## 十、类型定义追踪

### 10.1 Product (types.ts)

| 字段 | 需求来源 | 状态 |
|------|----------|------|
| id | 基础 | ✅ |
| title | BRD §5.1 | ✅ |
| description | BRD §5.1 | ✅ |
| source | BRD §5.1 | ✅ |
| sourceUrl | Excel字段 | ✅ |
| priceCny | Excel字段 | ✅ |
| images[] | Excel字段 | ✅ |
| skus[] | BRD §5.3 | ✅ |
| attributes[] | BRD §5.1 | ✅ |
| status | BRD §5.1 | ✅ |
| targetLocale | BRD §5.1a | ✅ |
| categoryId | BRD §5.1 | ⚠️ planned |
| hasVariants | BRD §5.1b | ⚠️ planned |
| processed | BRD §5.4 | ⚠️ planned |

### 10.2 ProductImage (types.ts)

| 字段 | 需求来源 | 状态 |
|------|----------|------|
| id | 基础 | ✅ |
| url | Excel字段 | ✅ |
| localPath | 本地存储 | ✅ |
| type | BRD §5.2 | ✅ |
| sort | 排序 | ✅ |
| hasWatermark | BRD §5.2 | ✅ |
| priceTag | 需求发现 | ✅ |
| sensitiveContent | BRD §5.2 | ✅ |
| status | BRD §5.2a | ✅ |

### 10.3 ProductSku (types.ts)

| 字段 | 需求来源 | 状态 |
|------|----------|------|
| id | 基础 | ✅ |
| name | Excel字段 | ✅ |
| color | SKU颜色 | ✅ |
| size | SKU尺码 | ✅ |
| price | Excel字段 | ✅ |
| stock | BRD §5.3 | ✅ |
| skuCode | BRD §5.3 | ✅ |
| weight | BRD §5.3 | ✅ |
| patternSuffix | BRD §5.3 | ✅ |
| isDummyHook | BRD §5.3 | ✅ |

---

## 十一、测试文件追溯

| 测试文件 | 被测模块 | 需求对应 |
|----------|----------|----------|
| `skuEncoder.test.ts` | skuEncoder.ts | BRD §4 |
| `titleRules.test.ts` | titleRules.ts | BRD §3.2 |
| `imageRules.test.ts` | imageRules.ts | BRD §3.4 |
| `antiBan.test.ts` | antiBan.ts | BRD §6, §8 |
| `marketPricing.test.ts` | marketPricing.ts | BRD §7 |
| `status.test.ts` | status.ts | BRD §5 |
| `contracts.test.ts` | contracts.ts | EXT-2~5 |
| `engine.test.ts` | engine.ts | BRD-1.3 |

---

## 十二、统计汇总

| 模块 | 文件数 | 函数数 | 已测试 |
|------|--------|--------|--------|
| listing入口 | 1 | 10 | - |
| SKU编码 | 1 | 8 | ✅ |
| 类目模板 | 1 | 2 | - |
| 标题规则 | 1 | 4 | ✅ |
| 图片规则 | 1 | 2 | ✅ |
| 防封检查 | 1 | 5 | ✅ |
| 定价规则 | 1 | 3 | ✅ |
| 契约定义 | 1 | 3 | ✅ |
| 流水线 | 1 | 4 | ⚠️ |
| **总计** | **9** | **41** | **6/9** |

---

**最后更新**：2026-05-30
