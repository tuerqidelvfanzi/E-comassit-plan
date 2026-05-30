# 需求追踪模板 - 索引

> 版本：v2.0 | 日期：2026-05-30

---

## 📋 追踪文档目录

```
docs/requirements-tracker/
├── README.md                    # 本文件 - 索引概览
├── FIELD_CHECKLIST.md          # 字段核对清单（需求文档 → 代码实现）
├── INTERFACE_CHECKLIST.md      # 界面字段核对清单（UI → 代码实现）
├── CODE_TRACE.md               # 代码追溯表（代码路径 → 需求对应）
├── MODIFICATION_SUGGESTIONS.md # 修改意见文档 ⭐新增
└── CHECK_HISTORY.md            # 核对历史记录
```

---

## ⚠️ 重要发现

根据对以下文档的详细核对：

| 文档名称 | 核心发现 |
|----------|----------|
| 谷歌报告1.html | SKU编码需要6段（含印花后缀+B/+H） |
| 谷歌报告2.html | 需要双栏对比UI、AI面料检测 |
| 上品实操PPT.pptx | 菲律宾固定500PHP、包裹尺寸10-5-10 |
| 越南SHOPEE编品教程.pptx | 越南站13步流程、图片9张要求 |

**发现2个严重问题需要立即修复！**

---

## 📊 核对结果概览

### 严重问题（P0）

| 问题 | 严重程度 | 影响 |
|------|----------|------|
| SKU编码格式错误 | ❌ 严重 | 格式不匹配，六段变五段 |
| 业务流程步骤遗漏 | ❌ 严重 | 越南站13步只有10步 |

### 中等问题（P1）

| 问题 | 严重程度 |
|------|----------|
| 标题字数限制不一致 | ⚠️ 中等 |
| 图片处理流程不完整 | ⚠️ 中等 |
| 包裹尺寸缺失 | ⚠️ 中等 |
| 界面布局缺失 | ⚠️ 中等 |

---

## 🔄 核对流程

### 1. 需求文档 → 代码核对

1. 读取需求文档（`D:\01-工作\10-国际物流\广西\电商项目\调研资料\`）
2. 对照代码实现（`d:\02-学习\06-yitang\app\`）
3. 填写 [FIELD_CHECKLIST.md](FIELD_CHECKLIST.md)
4. 标记状态：✅ 已实现 / ⚠️ 部分实现 / ❌ 未实现

### 2. 界面 → 需求核对

1. 查看UI界面
2. 对照需求文档字段
3. 填写 [INTERFACE_CHECKLIST.md](INTERFACE_CHECKLIST.md)
4. 标记缺失字段

### 3. 生成修改意见

1. 运行 `MODIFICATION_SUGGESTIONS.md`
2. 按优先级排序
3. 分配责任人

---

## 📁 需求文档来源

| 文档名称 | 日期 | 核心内容 |
|----------|------|----------|
| 谷歌报告1.html | - | SKU编码6段、AI面料检测 |
| 谷歌报告2.html | - | 双栏对比、多店铺同步 |
| 上品实操PPT.pptx | - | TikTok上品流程、菲律宾定价 |
| 越南SHOPEE编品教程.pptx | 2025-09-06 | Shopee越南13步流程 |
| 电商商品采集上架功能开发讨论.md | 2026-05-12 | 核心采集流程 |
| TikTok选品与运营流程讨论.md | 2026-05-13 | TikTok上品流程 |

---

## 📁 代码文件来源

| 模块 | 路径 | 状态 |
|------|------|------|
| 领域逻辑 | `api/src/domain/listing.ts` | ⚠️ 需修改 |
| SKU编码 | `shared/listing/skuEncoder.ts` | ❌ 需修复 |
| 类目模板 | `shared/listing/categoryTemplates.ts` | ⚠️ 需补充 |
| 标题规则 | `shared/listing/titleRules.ts` | ⚠️ 需增强 |
| 图片规则 | `shared/listing/imageRules.ts` | ⚠️ 需补充 |
| 防封检查 | `shared/listing/antiBan.ts` | ✅ 正常 |
| 定价规则 | `shared/listing/marketPricing.ts` | ⚠️ 需补充 |
| 流水线 | `shared/pipeline/engine.ts` | ⚠️ 部分实现 |

---

## 🔧 修改优先级

### P0（必须立即修复）
1. SKU编码格式 - 改为六段（含印花后缀+B/+H）
2. 越南Shopee 13步流程 - 补充完整流程图

### P1（本周内完成）
3. 包裹尺寸字段 - 新增PackageDimensions
4. 标题字数验证增强
5. 图片9张处理
6. ADS Power环境检测

### P2（迭代开发）
7. 双栏对比UI
8. 采集源GMV/CTR字段
9. 工厂API对接

---

## 📅 核对历史

| 日期 | 版本 | 核对人 | 变更说明 |
|------|------|--------|----------|
| 2026-05-30 | v1.0 | Claude | 初始核对：字段95项100%通过 |
| 2026-05-30 | v2.0 | Claude | 详细核对：发现6个问题，2个严重 |

---

## ⚠️ 详细修改意见

请查看 [MODIFICATION_SUGGESTIONS.md](MODIFICATION_SUGGESTIONS.md) 获取完整的修改建议。

---

## 📞 更新维护

- **核对频率**：每次需求变更后重新核对
- **责任人**：开发团队
- **同步文件**：
  - [BUSINESS_REQUIREMENTS_TRACEABILITY.md](../BUSINESS_REQUIREMENTS_TRACEABILITY.md)
  - [LISTING_PUBLISH_IMPLEMENTATION.md](../LISTING_PUBLISH_IMPLEMENTATION.md)
