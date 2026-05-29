# 浏览器插件（演示版 v0.3）

与 `web/` 后台配合，实现「采集 → 采集箱 → 草稿 → 正式发布」流程演示。

## 支持站点（分层提取）

| 站点 | 适配器 | 提取顺序 |
|------|--------|----------|
| 1688 详情 | `adapters/1688.js` | L1 内嵌 JSON → L2 JSON-LD → L4 DOM |
| 淘宝 / 天猫详情 | `adapters/taobao.js` | 同上 |
| 拼多多（移动站） | 通用 DOM 兜底 | L2 → L4 |

核心入口：`content/shared/extract-product.js` → `PsaExtractProduct.extractProduct()`。

打包：在 `web/` 目录执行 `npm run zip:extension`，输出至 `web/public/downloads/`。

安装说明见 `INSTALL.md`。
