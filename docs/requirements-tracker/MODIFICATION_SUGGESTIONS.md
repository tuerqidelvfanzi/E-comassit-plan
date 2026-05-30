# 代码修改意见

> 版本：v2.0 | 日期：2026-05-30
> 需求来源：
> - 谷歌报告1.html
> - 谷歌报告2.html
> - 上品实操PPT.pptx
> - 越南跨境SHOPEE编品教程(250906).pptx
> - 2.2泰国上品实操流程.pdf

---

# 一、严重问题（需立即修复）

## 问题1：SKU编码格式错误 ❌

### 问题描述
当前代码实现的是5段SKU编码：
```
BF-0001-PR-WH-S
```

但需求文档（谷歌报告、PPT）明确要求6段格式：
```
BF-0001-PR-WH-S+B  或  BF-0001-PR-WH-S-H
```

### 需求依据
来自谷歌报告2.html和上品实操PPT.pptx：
> SKU编码规则：前缀-商品编号-正/背面(P/R/PR)-颜色-尺码+后缀
> +B = 白底黑花 (White base + Black print)
> +H = 黑底白花 (Black base + White print)

### 影响范围
- `shared/listing/skuEncoder.ts`
- `shared/listing/categoryTemplates.ts`
- types.ts 中的 ProductSku 类型

### 修改建议
```typescript
// skuEncoder.ts 修改

// 当前错误实现：
// export const SKU_PATTERN = /^([A-Z0-9]+)-(\d{4})-(P|R|PR)-([A-Z]{2})-([A-Z0-9]+)$/;

// 正确实现：
export const SKU_PATTERN = /^([A-Z0-9]+)-(\d{4})-(P|R|PR)-([A-Z]{2})-([A-Z0-9]+)([BH])$/;

// 新增后缀常量
export const PRINT_VARIANT_SUFFIX = {
  blackOnWhite: 'B',  // 白底黑花
  whiteOnBlack: 'H',  // 黑底白花
} as const;

// 修改 SkuEncodeInput
export type SkuEncodeInput = {
  prefix?: string;
  sequence: number;
  side: PatternSide;
  color: string;
  size: string;
  printVariant?: PrintVariant;  // 新增字段
};

// 修改 encodeSku 函数
export function encodeSku(input: SkuEncodeInput): string {
  const prefix = (input.prefix ?? SKU_DEFAULT_PREFIX).trim().toUpperCase();
  const colorCode = resolveColorCode(input.color);
  const size = input.size.trim().toUpperCase();
  const seq = formatSequence(input.sequence);
  const side = input.side;
  const variant = input.printVariant ? PRINT_VARIANT_SUFFIX[input.printVariant] : '';
  
  return `${prefix}-${seq}-${side}-${colorCode}-${size}${variant}`;
}
```

---

## 问题2：业务流程步骤遗漏 ❌

### 问题描述
当前实现只有10步TikTok流程，但实际需求是13步（越南Shopee）或更多步骤。

### 需求依据
来自越南跨境SHOPEE编品教程PPT：

**Shopee越南站完整13步流程：**
1. 下载安装店八方应用 → 登录账号
2. 点击"上货" → 进入采集箱
3. 点击编辑进入未发布的产品链接
4. 编辑产品标题（越南语≤20字符，汉字压缩到9-10字）
5. 编辑简易描述（删除品牌/产地/发货地/3C认证等）
6. 编详细描述（优化文案）
7. 选择正确的产品类目
8. 编辑SKU（售价×350%，库存50，重量统一修改）
9. 编辑产品图片（9张，1:1比例，翻译+消除笔）
10. 编辑物流信息
11. 保存修改越南
12. 一键翻译越南语
13. 发布产品

### TikTok泰国站10步（上品实操PPT）：
1. 产品管理 → 增加新产品
2. 上传主图（最少5张）
3. 编辑标题（参考Tk同行，翻译成英文）
4. 选择类目（T-shirts）
5. 选择品牌（无品牌）
6. 设置变体（颜色+尺码）
7. 设置SKU编码（六段格式）
8. 设置规格模板（4张详情图+尺寸图）
9. 上传详情图（4张固定顺序）
10. 发布产品

### 修改建议
需要在 `docs/LISTING_PUBLISH_IMPLEMENTATION.md` 中补充完整流程图，并更新UI交互逻辑。

---

## 问题3：标题字数限制不一致 ❌

### 问题描述
当前实现越南Shopee标题限制为≤20字符，但Shopee越南站实际要求更严格。

### 需求依据
来自越南跨境SHOPEE编品教程PPT：
> 越南站限制字符为20字，汉字需要删减到10-9字以内才能保证不超出。

### 修改建议
```typescript
// titleRules.ts 增强验证逻辑
export function validateVietnamTitle(title: string): TitleValidationResult {
  const charCount = countTitleChars(title);
  const cjkCount = countCjkChars(title);
  const issues: TitleValidationIssue[] = [];

  if (charCount > VIETNAM_TITLE_MAX) {
    issues.push({
      code: 'TITLE_TOO_LONG',
      severity: 'error',
      message: `标题${charCount}字符，超出${VIETNAM_TITLE_MAX}字符限制`,
    });
  }

  if (cjkCount > VIETNAM_CJK_RECOMMENDED_MAX) {
    issues.push({
      code: 'CJK_TOO_MANY',
      severity: 'warn',
      message: `标题含${cjkCount}个汉字，翻译后可能超出越南站限制`,
    });
  }

  return { ok: issues.filter(i => i.severity === 'error').length === 0, charCount, cjkCount, issues };
}
```

---

# 二、中等问题（需优化）

## 问题4：图片处理流程不完整 ⚠️

### 需求依据
来自越南跨境SHOPEE编品教程PPT：
1. 挑选前9张图片修改尺寸1:1（800*800）
2. 用消除笔P掉敏感内容
3. 点击图片翻译，选择中→越进行翻译
4. 手动调整译图，优化图片面板整洁
5. 检查是否还有中文字体残留

---

## 问题5：SKU价格计算逻辑不完整 ⚠️

### 需求依据
来自上品实操PPT.pptx：
```
菲律宾站定价固定值：
- 价格：500 PHP
- 数量：800
- 重量：220g
- 包裹尺寸：10-5-10（cm）
```

### 修改建议
```typescript
// 新增包裹尺寸
export type PackageDimensions = {
  length: number;
  width: number;
  height: number;
};

export const DEFAULT_PACKAGE: Record<TargetMarket, { weight: number; dimensions: PackageDimensions }> = {
  'vn-shopee': { weight: 220, dimensions: { length: 10, width: 5, height: 10 } },
  'th-tiktok': { weight: 220, dimensions: { length: 10, width: 5, height: 10 } },
  'ph-shopee': { weight: 220, dimensions: { length: 10, width: 5, height: 10 } },
  'id-shopee': { weight: 220, dimensions: { length: 10, width: 5, height: 10 } },
};
```

---

# 三、界面字段问题

## 问题6：工作台缺少双栏对比视图 ⚠️

### 需求依据
来自谷歌报告2：
> 双栏对比预译：编辑界面应采用双栏布局。左侧展示采集源的原标题/原图，右侧展示AI优化后的本地化标题与处理后图片。

---

# 四、修改优先级

## P0（必须立即修复）
1. SKU编码格式 - 改为六段（含印花后缀+B/+H）
2. 越南Shopee 13步流程 - 补充完整流程图
3. 图片9张处理 - 补充越南站特殊要求

## P1（本周内完成）
4. 包裹尺寸字段 - 新增PackageDimensions
5. 标题字数验证增强
6. ADS Power环境检测

## P2（迭代开发）
7. 双栏对比UI
8. 采集源GMV/CTR字段
9. 工厂API对接

---

# 五、核对结果统计

| 问题类型 | 数量 | 严重程度 |
|----------|------|----------|
| SKU编码格式错误 | 1 | 严重 |
| 业务流程步骤遗漏 | 1 | 严重 |
| 标题字数限制不一致 | 1 | 中等 |
| 图片处理流程不完整 | 1 | 中等 |
| 包裹尺寸缺失 | 1 | 中等 |
| 界面布局缺失 | 1 | 中等 |

**总计发现：6个主要问题，其中2个严重问题需立即修复**

---

**核对人**：Claude
**核对日期**：2026-05-30
