# 原始资料清单与阅读声明

> 日期：2026-05-30  
> 用途：需求 v2.0 重基线的**唯一依据来源**说明  
> 原则：**不沿用**此前 v1/v2 演示版需求文档中的优先级与「已实现」结论

---

## 1. 本仓库内已读原始/近原始资料

| 文档 | 性质 | 核心内容 |
|------|------|----------|
| [`BUSINESS_REQUIREMENTS_DEV.md`](./BUSINESS_REQUIREMENTS_DEV.md) | **主原始需求转写** | 选品→采集→优化→搬家；越南 Shopee **13 步**（含 ERP 操作路径）；泰国 TikTok **10 步**；五段 SKU、白色钩子、定价倍率、图片 9 张规则、违禁清单 |
| [`requirements-tracker/MODIFICATION_SUGGESTIONS.md`](./requirements-tracker/MODIFICATION_SUGGESTIONS.md) | 原始资料核对记录 | 指向外部：谷歌报告 1/2、上品 PPT、越南编品 PPT、泰国 PDF；六段 SKU（+B/+H）、双栏对比、13 步遗漏 |
| [`requirements-tracker/FIELD_CHECKLIST.md`](./requirements-tracker/FIELD_CHECKLIST.md) | 字段级核对 | Excel 采集字段、越/泰平台字段、图片保留/删除类型 |
| [`PROJECT_PLAN.md` 附录](./PROJECT_PLAN.md) | **会议白板** | 放弃万能 Prompt；童装模板先行；累积类目模板；流量数据换词；LLM 效果差需查模型/Prompt |
| [`COLLECT_SCHEMA.md`](./COLLECT_SCHEMA.md) | 技术契约（非业务源） | NormalizedProduct 字段 — 仅作实现约束参考 |
| [`SCOPE_FEATURES.md`](./SCOPE_FEATURES.md) | 界面模块划分 | Scope-A 插件 / Scope-B Web — **可引用界面分区，不可引用业务优先级** |

## 2. 仓库外原始资料（已读摘要）

路径：团队共享盘（路径已脱敏，联系维护者获取访问方式）  
索引与确认规则：[`original-research/README.md`](./original-research/README.md)

| 文件 | 已确认要点 |
|------|------------|
| 谷歌报告1.html | 六段 SKU `+B`/`+H`；菲 500 PHP；包裹 10×5×10；双栏对比 |
| 谷歌报告2.html | GMV/CTR 选品、多店同步 |
| 东南亚电商T恤…2026-05-13*.md | 印花后缀 B/H；跟品 20%/全新 80% |
| TikTok跨境电商选品…2026-05-14*.md | 周 GMV、CTR、同款数三维 |
| 店铺商品图片翻译…2026-05-12*.md | 批量翻译、越南语 |
| 电商商品采集上架…2026-05-12*.md | 拼多多反爬 |

**缺口**：PPT/PDF 未在本机全文 OCR；与 BRD 冲突时以运营确认为准（见 PRD §8 ADR-TBD-01）。

## 3. 本次**新做**的网络调研（2026-05-30）

见 [`RESEARCH_V2_ORIGIN.md`](./RESEARCH_V2_ORIGIN.md) — 独立于旧版 `BEST_PRACTICES_RESEARCH.md` / `DEEP_RESEARCH_V2.md` 重写。

## 4. 明确不当作需求依据的内容

- 当前代码实现状态（「已实现 ✅」类 tracker 结论）
- 上一版 `REQUIREMENTS_V2.md` 的里程碑与 Mock 演示范围
- 店八方/店小秘/妙手等**产品功能清单的照搬**（仅作行业对照，不作我方功能全集）

---

*阅读声明结束*
