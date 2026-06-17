# ecommerce-scraper · 配置与上手指南

本文档讲清楚**每一项配置从哪申请、怎么填、填完怎么验证**。

> 📌 **核心原则**：`.env` 是唯一配置来源。**所有密钥都不进代码、不进 git**。

---

## 🎯 速查：四类配置，一图看懂

| 类别 | 用途 | 是否必需 | 申请难度 |
|------|------|---------|---------|
| **住宅代理** | 防 Amazon CAPTCHA / 国内平台出口 | 强烈推荐 | 中（付费） |
| **Apify** | 第三方云端抓取，作 ground truth 对比 | 推荐 | 易（注册即用，有免费额度） |
| **大模型 API** | LLM 提取/翻译 description | 可选 | 易（注册即用） |
| **中国商家 API** | 自己店铺的合法数据 | 走商家后台才要 | 难（需商家资质审核） |

---

## 1. 🛡️ 住宅代理（推荐配置）

### 为什么需要

- Amazon、Shopee、Lazada 等**对数据中心 IP 严打**：触发 CAPTCHA、轻则丢数据、重则封 IP 24h
- 国内平台（淘宝/京东/拼多多）**对海外 IP 直接拒**或返回假数据
- 普通 VPN 出口 IP 大部分是**机房 IP**（已被各大平台标黑），必须用**住宅 IP**

### 推荐服务商（2026-06 行情）

| 服务商 | 起价 | 优势 | 申请 |
|--------|------|------|------|
| **Bright Data** | ~$10/GB | 最大、最稳、住宅 IP 池最大 | https://brightdata.com |
| **Smartproxy** | ~$8/GB | 性价比，按 IP 计费 | https://smartproxy.com |
| **IPRoyal** | ~$4/GB | 便宜，新手友好 | https://iproyal.com |
| **Oxylabs** | ~$12/GB | 高质量，电商数据专用 | https://oxylabs.io |

### 申请步骤（以 Bright Data 为例）

1. 注册 https://brightdata.com → 选 "Residential Proxies"
2. 选 **Pay per GB**（按流量付）
3. 创建 Zone → 选 "Residential" → 拿到：
   - Host: `brd.superproxy.io`
   - Port: `22225`
   - User: `brd-customer-XXXX-zone-residential`
   - Password: `yourpassword`
4. 填到 `.env`：
   ```
   PROXY_URL=http://brd-customer-XXXX-zone-residential:yourpassword@brd.superproxy.io:22225
   ```

### 验证代理

```bash
# 测连通性
curl --proxy "http://user:pass@host:port" https://api.ipify.org
# 应返回住宅 IP（如 73.xxx.xxx.xxx 美国住宅）

# 项目内测
python -c "from scraper.config import settings; print('PROXY_URL:', settings.proxy_url or '未配置')"
```

### 临时不用代理

留空 `PROXY_URL=` 即可，会直连（可能被 CAPTCHA）。

---

## 2. ☁️ Apify token（推荐）

### 为什么需要

- **Apify = 云端爬虫市场**，对国际电商有现成 actor：
  - `apify/amazon-product-scraper`
  - `valig/amazon-product-details-scraper`
  - `apify/shopee-scraper`
  - `apify/lazada-product-scraper`
- 本项目把 Apify 当 **ground truth**：本地抓得对不对，拿 Apify 一对比就知道
- 不配 Apify → 只跑本地单轨，**无对比无校验**

### 申请步骤

1. 访问 https://console.apify.com → 注册（GitHub 登录最快）
2. 左侧菜单 → **Settings** → **Integrations** → **Personal API tokens**
3. 点 **Create new token** → 命名（如 "scraper"） → 复制 token
4. 填到 `.env`：
   ```
   APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxx
   ```

### 免费额度

- 注册送 **$5 免费 credit**
- Amazon scraper 约 **$0.5/1000 商品**
- 也就是说免费额度够你**测 ~10000 个商品**

### 验证 Apify

```bash
python -c "import os; from apify_client import ApifyClient; c = ApifyClient(os.environ['APIFY_TOKEN']); print('账号:', c.user().get()['username'])"
# 应输出你的用户名
```

### 项目内测试（带 Apify 跑 Amazon 真商品）

```bash
# 1. 先用 mock 跑通（无 token）
python compare_view.py --mock
# 浏览器打开 compare_view.html 看效果

# 2. 配了 APIFY_TOKEN 后抓真商品
python cli.py scrape "https://www.amazon.com/dp/B08N5WRWNW"
# 应输出本地 + Apify 两份结果 + 对比
```

---

## 3. 🤖 大模型 API Key（可选）

### 用途（按规划）

- 从 description 自动提取**结构化规格**（颜色、尺寸、材质）
- 跨语言翻译 description
- 商品标题/品牌归一化（Amazon "Echo Dot 4th Gen" = 京东 "Echo Dot 第四代"）

### 支持的服务商

| 服务商 | 申请 | 备注 |
|--------|------|------|
| **OpenAI** | https://platform.openai.com/api-keys | 最稳，按 token 收费 |
| **Anthropic** | https://console.anthropic.com | Claude，需手动包装 |
| **DeepSeek** | https://platform.deepseek.com | 国内最便宜，OpenAI 兼容 |
| **通义千问** | https://dashscope.aliyun.com | 阿里，OpenAI 兼容 |

### 申请步骤（OpenAI）

1. 访问 https://platform.openai.com → 注册 → 绑卡（**最低 $5 充值**）
2. 左侧 → **API keys** → **Create new secret key** → 命名 → 复制
3. 填到 `.env`：
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
   OPENAI_MODEL=gpt-4o-mini  # 便宜 ($0.15/M token)
   ```

### 国内替代（推荐用 DeepSeek，价格 1/50）

```
OPENAI_API_KEY=sk-deepseek-xxx
OPENAI_MODEL=deepseek-chat
# 但需在代码里改 base_url（当前版本固定 OpenAI 端点）
```

> 当前代码已留 `OPENAI_MODEL` 字段，待接入实际 LLM 调用逻辑时再扩展 base_url。

### 验证 OpenAI

```bash
python -c "import os; import httpx; r = httpx.get('https://api.openai.com/v1/models', headers={'Authorization': f'Bearer {os.environ[\"OPENAI_API_KEY\"]}'}); print('模型数:', len(r.json()['data']))"
```

---

## 4. 🇨🇳 中国电商商家 API（自己店铺才用）

> ⚠️ **重要边界**：本节是**"拉自己店铺数据"**的合规路径。
> **抓竞品 = 严禁** → 用 Apify 委托第三方服务。

### 4.1 淘宝 / 天猫

**申请**：https://open.taobao.com

1. 用**卖家主账号**登录
2. 顶部 → **应用** → **创建应用** → 选 **商家应用**
3. 申请能力：`taobao.item.get`（商品详情）、`taobao.trades.sold.get`（订单）
4. 审核 1-3 天 → 通过后拿到：
   - `AppKey`
   - `AppSecret`
5. **OAuth 授权**获取 `AccessToken`（一次性，30天有效）
6. **白名单 IP**：在应用后台配置你服务器的公网 IP

**填到 .env**：
```
TAOBAO_APP_KEY=12345678
TAOBAO_APP_SECRET=xxxxxxxxxxxxxxxx
TAOBAO_ACCESS_TOKEN=xxxxxxxxxxxxxxxx
```

**项目内测试**：
```bash
python cli.py my-product --platform=taobao --item-id=你的商品ID
# 应输出：标题/价格/库存/方法=taobao-open-api:...
```

### 4.2 京东 POP 商家

**申请**：https://open.jd.com

1. 用**POP 商家账号**登录（**自营不行**）
2. 应用 → 创建 → 申请 `jingdong.ware.get`（商品）
3. 拿 AppKey/AppSecret + OAuth 拿 access_token
4. **签名算法不同**：京东用 **HMAC-SHA256**（项目已实现）

**填到 .env**：
```
JD_APP_KEY=xxx
JD_APP_SECRET=xxx
JD_ACCESS_TOKEN=xxx
```

### 4.3 抖店 / 抖音电商

**申请**：https://op.jinritemai.com

1. 抖店商家后台 → 开放平台 → 创建应用
2. 申请 `product.detail`（商品详情）
3. 拿 AppKey/AppSecret + access_token
4. ⚠️ **抖店 API 文档频繁变动**，签名算法可能需调整（项目已留 `DOUYIN_SHOP_*` 配置）

**填到 .env**：
```
DOUYIN_SHOP_APP_KEY=xxx
DOUYIN_SHOP_APP_SECRET=xxx
DOUYIN_SHOP_ACCESS_TOKEN=xxx
```

### 4.4 拼多多

**申请**：https://open.pinduoduo.com

1. 多多进宝/拼多多商家 → 开放平台
2. 创建应用 → 申请 `pdd.goods.detail.get`
3. ⚠️ 拼多多审核严，**个人开发者难通过**，需企业资质

**填到 .env**：
```
PINDUODUO_APP_KEY=client_id
PINDUODUO_APP_SECRET=client_secret
PINDUODUO_ACCESS_TOKEN=xxx
```

### 4.5 1688

**申请**：https://open.1688.com

1. 1688 商家账号 → 开放平台
2. 申请 `alibaba.product.get`
3. 拿 AppKey/AppSecret + access_token

**填到 .env**：
```
_1688_APP_KEY=xxx
_1688_APP_SECRET=xxx
_1688_ACCESS_TOKEN=xxx
```

### 4.6 唯品会 / 苏宁（占位）

**当前状态**：API 需联系商务，未公开文档。
**做法**：跳过这两个平台，**用 Apify 委托第三方**（唯品会和苏宁有现成 actor）。

---

## 5. 🎬 端到端验证清单

填完所有配置后，按顺序跑：

```bash
# 1. 单元测试（不需任何凭据）
pytest tests/ -v
# 期望：37 passed

# 2. 端到端 smoke test
python smoke_test.py
# 期望：11/11 ✅

# 3. 配置向导复查
python setup_wizard.py
# 应显示已配置项，问是否更新

# 4. Mock 对比可视化（不需网络）
python compare_view.py --mock
# 浏览器打开 compare_view.html 看效果

# 5. 真实抓取（配了 proxy + apify 后）
python cli.py scrape "https://www.amazon.com/dp/B08N5WRWNW"
# 期望：本地 ✓ + Apify ✓ + 一致度 > 95%

# 6. 商家 API 拉自己商品
python cli.py my-product --platform=taobao --item-id=xxx
# 期望：标题/价格/库存正确返回
```

---

## 6. 🆘 常见问题

### Q: 配了代理但 Amazon 仍 503？
A: 1) 确认代理是**住宅 IP**（不是机房） 2) 确认 User-Agent 没暴露 3) 启用 Playwright fallback：`use_browser_fallback=True`

### Q: Apify 报 401？
A: token 错了 → 去 console.apify.com → Settings → Integrations 重新生成

### Q: 商家 API 报 "incomplete"？
A: 1) 确认 access_token 没过期（30 天） 2) 确认服务器 IP 在白名单 3) 确认应用有该 API 权限

### Q: 想换模型但代码里写死 OpenAI？
A: 暂时需要在 `scraper/config.py` 改 `openai_model` 字段 + 后续在 LLM 客户端里改 base_url

### Q: LLM key 在国内用不了？
A: 换 DeepSeek（OpenAI 兼容 API），但需在 `scraper/llm.py`（待实现）里改 base_url

---

## 7. 🔐 安全提醒

1. **`.env` 不进 git**（已在 .gitignore）
2. **不要把 .env 发给别人**（含真实 token）
3. **生产环境用环境变量**而非 .env 文件（更安全）
4. **定期轮换 token**（尤其 Apify、商家 API）
5. **Apify 设预算上限**：`APIFY_MAX_CHARGE_USD=10.0`（每月最多 10 美元）

---

## 8. 📞 获取更多帮助

- 项目 README.md — 架构总览
- 项目 PIPELINE.md（上级仓库 docs/）— 整体开发管道
- 项目 smoke_test.py — 自检入口
- Apify 文档：https://docs.apify.com
- 淘宝开放平台 FAQ：https://open.taobao.com/docs/FAQ.htm
