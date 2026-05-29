# 浏览器插件规范

## 形态

- **Manifest V3**（Chrome / Edge；Firefox 可后续适配）
- 三端：**Popup**（快捷操作）、**Background**（网络与队列）、**Content Scripts**（按站点注入）

## Popup 功能（原型已实现线框）

1. 显示 B 站登录状态（Token 是否有效）
2. 「采集当前页」→ 解析 → 预览 → 确认上传
3. 「粘贴链接采集」（调用 B 站 parse API）
4. 最近 5 条采集记录快捷入口

## 采集提取策略（分层，见 `COLLECT_ARCHITECTURE.md`）

Content Script 内 `extractProduct()` 按顺序尝试，命中即返回：

1. 页面内嵌 JSON / 状态对象  
2. `application/ld+json`  
3. （仅 Worker）拦截 XHR 复用的 API 响应  
4. DOM 选择器（服务端 `GET /extension/selectors` 热更新，多选择器 fallback）

**插件不做**静默批量爬榜单；批量 TOP N（默认 10、延迟 250–2400ms）由 B 站发起任务，**Collect Worker**（Playwright + Crawlee）执行。

## Content Script 站点矩阵

| 阶段 | 站点类型 | 用途 |
|------|----------|------|
| P0 | 1688 / 淘宝详情 | 源站采集（插件：当前页确认） |
| P0 | 任意（通用） | 链接模式由 B 站 parse / Worker |
| P1 | Shopee / TikTok 卖家后台 | 草稿写入 |
| P2 | 拼多多、Amazon | 扩展源站 |

## 字段映射（NormalizedProduct）

```json
{
  "source": "1688",
  "sourceUrl": "https://...",
  "title": "",
  "price": { "amount": 0, "currency": "CNY" },
  "images": [],
  "skus": [],
  "attributes": {},
  "capturedAt": "ISO8601"
}
```

选择器存服务端 `/extension/selectors`，避免每次发版改选择器。

## 与 B 站通信

- 开发：`http://localhost:3004` 授权页跳转拿 Token
- 生产：`https://app.example.com/extension/connect`
- Header：`Authorization: Bearer <extension_token>`

## 权限原则（审核友好）

- `activeTab` + 明确 host_permissions，按阶段递增
- 不申请 `<all_urls>` 除非必要
- Cookie 读取需选项开关 + 设置页说明

## 发布写稿流程

1. B 站创建 `publish-tasks`，状态 `pending`
2. 用户打开目标平台「新建商品」页
3. Popup：「填入草稿」→ Content 填表（可逐字段高亮）
4. 用户保存草稿 → Content 点击「已保存」→ PATCH task `completed`

失败码：`selector_miss`, `auth_expired`, `captcha_required`, `validation_error`
