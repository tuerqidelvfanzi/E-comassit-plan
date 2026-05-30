# 浏览器插件（演示版 v0.6）

与 `web/` + `api/` 配合：**采集 → 采集箱 → 发布中心填表 → 卖家后台 DOM + Mock 预览**。

## v0.6 发布填表

| 能力 | 说明 |
|------|------|
| Popup 三栏 | 连接 / 采集 / 发布 |
| API 填表载荷 | `GET /api/v1/extension/publish-fill` |
| DOM 填入 | 淘宝 / Shopee / TikTok 选择器（最佳努力） |
| Mock 预览面板 | 卖家页左侧浮动面板，展示完整填表 JSON |
| 浮动按钮 | 卖家页右下角「电商助手」重新打开面板 |

实现：`content/publish-fill.js` · 选择器 `content/shared/selectors-*-seller.js`

## 支持站点（采集）

| 站点 | 适配器 | 提取顺序 |
|------|--------|----------|
| 1688 详情 | `adapters/1688.js` | L1 → L2 → L4 |
| 淘宝 / 天猫 | `adapters/taobao.js` | 同上 |
| 拼多多移动站 | 通用 DOM | L2 → L4 |

打包：在 `web/` 执行 `npm run zip:extension` → `web/public/downloads/ecommerce-assistant-extension-demo.zip`

安装见 `INSTALL.md`。图标生成：`python scripts/gen-extension-icons.py`（需 Pillow）。
