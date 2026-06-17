# ecommerce-scraper

**双轨制电商抓取引擎** —— 一次抓取，本地 + Apify 并行运行，自动对比校验。

## 支持平台（12 个）

### 🌍 国际电商（抓取为主）

| 平台 | 抓取 | Apify 对比 |
|------|:---:|:---------:|
| **Amazon** | ✅ | ✅ |
| **Shopee** | ✅ | ✅ |
| **Lazada** | ✅ | ✅ |
| **TikTok Shop** | ✅ | ✅ |

### 🇨🇳 中国电商（**双路径**）

| 平台 | 竞品抓取 | **自己店铺（推荐）** |
|------|:-------:|:------------------:|
| 淘宝 / 天猫 | ⚠️ 高风险 | ✅ 淘宝开放平台 |
| 京东 | ⚠️ 高风险 | ✅ 京东开放平台 |
| 拼多多 | ⚠️ 高风险 | ✅ 多多进宝 |
| 抖店 / 抖音电商 | ⚠️ 高风险 | ✅ 抖店开放平台 |
| 1688 | ⚠️ 高风险 | ✅ 1688 开放平台 |
| 唯品会 | ⚠️ 高风险 | ✅ 唯品会开放平台 |
| 苏宁 | ⚠️ 高风险 | ✅ 苏宁开放平台 |

> **国内电商核心原则**：
> - **自己店铺** → 永远用商家后台官方 API（合法、稳定、有 SLA）
> - **抓竞品** → 仅公开商品信息，不绕登录，不抓个人信息
> - 国内抓竞品法律风险高（反不正当竞争法、ToS 严格），Apify 无成熟 Actor

## 核心特性

| 特性 | 说明 |
|------|------|
| 🛡 **7 层反反爬** | 代理池 / 限流 / 指纹 / 验证码 / 行为模拟 / 数据验证 / 合规 |
| 🔁 **双轨制** | 本地引擎 + Apify 云端 **并行运行** |
| 🧪 **自动对比** | 字段级 diff，相似度评分，漂移告警 |
| 🔧 **自校正** | 差异 → 写日志 → 可选自动更新本地规则 |
| 🌐 **多入口** | CLI + MCP Server + Python API |
| 🇨🇳 **官方 API** | 淘宝/京东/抖店商家后台 API 完整示例 |
| 📦 **12 平台** | Amazon/Shopee/Lazada/TikTok Shop + 7 个中国电商 |

## 安装

```bash
cd d:/02-学习/06-yitang/app/ecommerce-scraper
pip install -e ".[all]"
playwright install chromium
```

## 配置 `.env`

```bash
# 至少配一项：
APIFY_TOKEN=apify_api_xxx  # 推荐，开启双轨对比
OPENAI_API_KEY=sk-xxx       # LLM 提取（可选）

# 商家后台 API（如需拉自己店铺数据）
TAOBAO_APP_KEY=xxx
TAOBAO_APP_SECRET=xxx
TAOBAO_ACCESS_TOKEN=xxx
```

## 使用

### 1. CLI

```bash
# 抓国际电商（双轨 + 对比）
escrape scrape "https://www.amazon.com/dp/B0XXXXX"

# 抓国际电商（仅本地，不调 Apify）
escrape scrape "https://shopee.sg/...i.123.456" --no-apify

# 拉自己淘宝店铺的商品（用官方 API，不算抓取）
escrape my-product --platform=taobao --item-id=123456789

# 批量
escrape batch urls.txt

# 查漂移记录
escrape divergences
```

### 2. Python API

```python
from scraper import scrape, DualScrapeResult

# 国际电商竞品
result: DualScrapeResult = await scrape("https://www.amazon.com/dp/B0XXXXX")
print(f"Agreement: {result.comparison.agreement_score:.2%}")
print(f"Recommended price: ${result.comparison.recommended.price}")

# 自己的淘宝店铺
from scraper.merchant_api import TaobaoMerchantFetcher
taobao = TaobaoMerchantFetcher(
    app_key="...",
    app_secret="...",
    access_token="...",
)
my_product = await taobao.fetch_product("123456789")
print(f"我的商品：{my_product.title} 库存：{my_product.stock}")
```

### 3. MCP Server

```bash
python mcp_server.py

# Claude Code 中：
# mcp__escrape__scrape(url="https://...")
# mcp__escrape__my_product(platform="taobao", item_id="123")
# mcp__escrape__divergences()
```

## 架构

```
用户调用 (CLI/MCP)
    │
    ▼
Orchestrator
    │
    ├─→ LocalFetcher ──→ undetected-playwright/nodriver
    │                    平台特化（Amazon/Shopee/Lazada/TikTok）
    │
    ├─→ ApifyFetcher ──→ 云端 Actor（仅国际平台）
    │
    └─→ MerchantApiFetcher ──→ 官方 API（仅国内，自己店铺）
                                     │
                            ┌────────┴────────┐
                            ▼                 ▼
                    ProductResult       ProductResult
                            │                 │
                            └──────┬──────────┘
                                   ▼
                            Comparator
                            (字段级 diff + 漂移)
                                   │
                                   ▼
                         DualScrapeResult
```

## 目录结构

```
ecommerce-scraper/
├── scraper/
│   ├── core/
│   │   ├── result.py        # ProductResult / ComparisonResult
│   │   ├── fetcher.py       # Fetcher 抽象接口
│   │   ├── comparator.py    # 字段对比引擎
│   │   └── orchestrator.py  # 双轨编排
│   ├── platforms/
│   │   └── __init__.py      # 12 平台白名单
│   ├── apify.py             # Apify 客户端
│   ├── merchant_api.py      # 商家后台 API
│   ├── config.py
│   └── logging.py
├── cli.py                   # CLI 入口
├── mcp_server.py            # MCP 入口
├── pyproject.toml
└── README.md
```

## 合规声明

✅ **合法用法**：
- 抓公开商品信息（标题/价格/描述/规格）
- 自己店铺数据（用官方 API）
- 公开店铺评分/销量
- 公开评论（脱敏后）

❌ **禁止**：
- 抓登录后内容（订单/收藏/关注）
- 抓个人信息（用户昵称/头像/收货地址）
- 绕过验证码/付费墙
- 抓未成年人/金融/医疗数据
- 抓后转售原始数据

⚠️ **国内电商抓竞品特别警告**：
- 反不正当竞争法、ToS 严格
- 一旦封号/IP 不可恢复
- 仅限公开商品信息，用途合法
- **强烈建议抓竞品数据前咨询律师**
