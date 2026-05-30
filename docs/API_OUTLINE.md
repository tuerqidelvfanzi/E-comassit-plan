# API 纲要（REST `/api/v1`）

响应包络建议统一：`{ "code": 0, "message": "ok", "data": T }`

## Auth

| Method | Path | 说明 |
|--------|------|------|
| POST | `/auth/login` | 用户名密码 → JWT |
| POST | `/auth/refresh` | 刷新 |
| GET | `/auth/me` | 当前用户 |

## 采集

| Method | Path | 说明 |
|--------|------|------|
| POST | `/collect-jobs` | 插件/链接提交原始 payload |
| POST | `/collect-jobs/batch` | Phase 2：批量任务（榜单 URL、maxItems≤10、delay 250–2400ms） |
| GET | `/collect-jobs` | 列表、分页 |
| GET | `/collect-jobs/:id` | 详情 |
| POST | `/collect-jobs/:id/parse` | 服务端补全解析（链接模式） |
| GET | `/collect-adapters/:site` | Worker 站点适配器版本与脚本元数据 |

## 商品（采集箱）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/products` | 采集箱列表 `?status=&source=` |
| GET | `/products/:id` | 含 raw + processed 快照 |
| PATCH | `/products/:id` | 人工改字段 |
| DELETE | `/products/:id` | 删除 |

## 模板与规则

| Method | Path | 说明 |
|--------|------|------|
| GET | `/category-templates` | 类目模板（童装…） |
| POST | `/category-templates` | 创建 |
| PATCH | `/category-templates/:id` | 更新 Prompt/规则绑定 |
| GET | `/rule-sets` | 规则集 |
| POST | `/rule-sets` | 价格公式、截断等 |

## 处理管线

| Method | Path | 说明 |
|--------|------|------|
| POST | `/products/:id/pipeline-runs` | 触发处理（body: templateId, adhocPrompt, ruleSetIds） |
| GET | `/pipeline-runs/:id` | 状态与输出 |
| GET | `/products/:id/pipeline-runs` | 历史 |

## 洞察（P1）

| Method | Path | 说明 |
|--------|------|------|
| POST | `/products/:id/insights/competitors` | 触发竞品 TOP10 |
| POST | `/products/:id/insights/keywords` | 标题关键词归纳 |
| GET | `/insights/:jobId` | 异步结果 |

## 发布

| Method | Path | 说明 |
|--------|------|------|
| POST | `/publish-tasks` | 创建发布任务 |
| GET | `/publish-tasks` | 队列 |
| PATCH | `/publish-tasks/:id` | 插件回写状态 |

### 发布（上架扩展 · 见 `LISTING_PUBLISH_IMPLEMENTATION.md`）

| Method | Path | 阶段 | 说明 |
|--------|------|------|------|
| GET | `/publish-tasks/:id` | P1 | 任务详情（含 skus、images、logistics） |
| POST | `/publish-tasks` | P1 | Body 扩展：`description`, `price`, `currency`, `images`, `skus`, `logistics`, `channel` |
| PATCH | `/publish-tasks/:id` | P1 | status 增 `draft` \| `filling` \| `cancelled`；`reason`, `retryCount` |
| POST | `/publish-tasks/:id/validate` | P1 | antiBan + SKU 校验，不写库 |
| POST | `/products/:id/sku/encode` | P1 | 按模板批量生成 `skuCode` |
| GET | `/extension/selectors` | P1 | 含 `tiktok` 完整选择器（`shared/selectors/tiktok-seller.json`） |
| POST | `/link-catcher/enqueue` | P2 | Redis：手机端商品短链入队 |
| GET | `/link-catcher/poll` | P2 | PC/插件轮询同步链接 |
| POST | `/products/:id/images/watermark-remove` | P2 | AI 去水印异步任务 |
| POST | `/products/:id/images/model-generate` | P2 | AI 模特图异步任务 |
| POST | `/integrations/tiktok/oauth` | P2 | TikTok Open API 授权回调 |
| GET | `/integrations/adspower/profiles` | P2 | ADS Power 指纹环境列表 |

**PublishTask.status**（目标）：`draft` → `pending` → `filling` → `completed` \| `failed` \| `cancelled`  
**Product.status**（不变）：`raw` \| `processing` \| `ready` \| `published` — UI 映射 ListingStatus：`pending` \| `draft` \| `reviewing` \| `live` \| `suspended`

## 插件

| Method | Path | 说明 |
|--------|------|------|
| POST | `/extension/token` | 换取插件专用短期 Token |
| GET | `/extension/selectors` | 各平台 DOM 选择器配置（热更新） |
