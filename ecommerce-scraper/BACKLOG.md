# BACKLOG — 改进池 / 备用功能池

> **用途**: 记录本项目的所有改进建议、新功能想法、架构优化点。
> **状态**: `Todo` / `In Progress` / `Done` / `Wontfix`
> **追加规则**: 想到的点子先 append 到「想法池」区，定期整理到正式 backlog。

---

## 项目元信息

| 项 | 值 |
|---|---|
| 项目 | `ecommerce-scraper` (双轨制电商抓取引擎) |
| 路径 | `D:/02-学习/06-yitang/app/ecommerce-scraper/` |
| 创建日期 | 2026-06-15 |
| 当前版本 | 0.1.0 |
| MCP server | `mcp_server.py` (4 工具) |

---

## 会话 #1（2026-06-15）— Windows MCP / 爬虫方案调研

### 会话背景

研究 GitHub Windows MCP 项目 → 评估替代品 → 对比已有 `mcp-cn-commerce` → 发现本项目（`ecommerce-scraper`）架构更优 → 讨论 MCP 集成方案。

**外部项目对比表**：

| 外部项目 | 用途 | 与本项目关系 |
|---|---|---|
| `domdomegg/computer-use-mcp` | Win 桌面自动化 (nut.js + 截屏) | 替代品；DPI/多显示器下不稳 |
| `sh3ll3x3c/native-devtools-mcp` | Rust + UIA + OCR + CDP | Win 桌面 fallback 候选 |
| `microsoft/playwright-mcp` | 浏览器自动化官方 | 浏览器 fallback 候选 |
| `abencat-browser` | 指纹浏览器 + MCP | 跨境多账号防关联 |
| `TonyWang-hub/mcp-cn-commerce` | 国内电商官方 API (147 工具) | **互补**：抓竞品 vs 自己店铺 |
| `us/crw` / `WebReaper` / `cotdp/scraper-mcp` | 通用 scraping MCP | 比本项目通用但弱 |

---

## Todo（按优先级）

### P0 — 立刻能跑

#### [P0-1] MCP 接入 Claude Desktop config

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: `mcp_server.py` 已写好但未挂载到 Claude Desktop，无法在 Claude Code / Desktop 中调用
- **方案**: 写 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "escrape": {
      "command": "python",
      "args": ["D:/02-学习/06-yitang/app/ecommerce-scraper/mcp_server.py"],
      "env": {
        "APIFY_TOKEN": "apify_api_xxx",
        "TAOBAO_APP_KEY": "...",
        "TAOBAO_APP_SECRET": "...",
        "TAOBAO_ACCESS_TOKEN": "..."
      }
    },
    "commerce-cn": {
      "command": "mcp-cn-commerce",
      "args": ["--platforms", "oceanengine,doudian,jd"]
    }
  }
}
```

- **价值**: 30 min 内让 Claude 能用自然语言操控所有抓取
- **工作量**: 30 min

#### [P0-2] 补 MCP 工具：`batch_scrape`

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: `orchestrator.py` 已有 `scrape_batch()`（带并发控制 + 限流），但 `mcp_server.py` 没暴露
- **方案**: 在 `mcp_server.py` 加：

```python
@mcp.tool()
async def batch_scrape(urls: list[str], concurrency: int = 3, no_apify: bool = False) -> str:
    """批量抓取，带并发控制和 Apify 对比"""
    results = await scrape_batch(urls, concurrency=concurrency, use_apify=not no_apify)
    return json.dumps([r.to_dict() for r in results], ensure_ascii=False, indent=2)
```

- **价值**: 解决"批量监控竞品"刚需
- **工作量**: 1 h

#### [P0-3] 补 MCP 工具：`search_products`

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: 现在只能按 URL 抓单个商品，缺关键词搜索（"Amazon 上 3 款 iPhone 保护壳"这类需求）
- **方案**: 走各平台 Apify Actor 的 search 端点（Amazon/Shopee/Lazada/TikTok Shop）
- **价值**: 从"已知商品监控"升级到"竞品发现"
- **工作量**: 2 h

---

### P1 — 商家数据闭环

#### [P1-1] 补 MCP 工具：`my_orders`

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: `merchant_api.py` 抽象基类有 `fetch_orders()` 但 MCP 没暴露；目前 `my_product` 只覆盖单商品
- **方案**:

```python
@mcp.tool()
async def my_orders(platform: str, start_date: str, end_date: str) -> str:
    """拉自己店铺订单（淘宝/京东/抖店等），日期格式 YYYY-MM-DD"""
    # 调对应 fetcher.fetch_orders(start, end)
```

- **价值**: 商家数据闭环（商品 + 订单 + 退款 + 库存）
- **工作量**: 2 h

#### [P1-2] 补 MCP 工具：`my_refunds` / `my_inventory`

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: 同 P1-1，基类抽象已有，MCP 缺
- **方案**: 同 P1-1 模板
- **价值**: 客服/选品分析支撑
- **工作量**: 2 h

#### [P1-3] 国内 local fetcher 显式拒绝 + 友好引导

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: `orchestrator.py` 注释说"国内高风险，请用 Apify 或 merchant_api"，但 `scraper/platforms/domestic.py` 仍是占位实现，用户撞墙时困惑
- **方案**: 国内平台直接 raise `RuntimeError` + 明确文案：

```python
async def fetch(self, url, **kwargs):
    raise RuntimeError(
        f"⚠️ {self.platform.display_name} 抓取竞品法律风险高。\n"
        f"   - 自己店铺：用 my_product(platform='{self.platform.value}', item_id='...')\n"
        f"   - 抓竞品：Apify 上无成熟 Actor，请确认用途合法"
    )
```

- **价值**: 避免用户浪费时间在死路上
- **工作量**: 30 min

---

### P2 — 差异化护城河

#### [P2-1] 漂移自进化（AI 修复 selector）

- **时间**: 2026-06-15
- **来源**: 会话 #1 + `orchestrator.py` 已有 TODO
- **背景**: 现在漂移只记录不修复，规则要手动维护
- **方案**:

```
漂移发生 (agreement < 80%)
    │
    ▼
MCP tool: drift_diagnose()
    │
    ├─→ 把 local vs apify 差异 (字段级 diff) 丢给 Claude
    │   │
    │   ▼
    │   Claude 分析: "Amazon 的 price 字段选择器从 #priceblock_ourprice
    │                  变成 #corePrice_feature_div"
    │
    ├─→ Claude 输出修复后的 CSS selector / XPath
    │
    └─→ 写入 platforms/amazon/selectors.yaml
        下次抓取自动用新规则
```

- **价值**: **别人没做的护城河**；维护成本从"手动"降到"半自动"
- **工作量**: 半天

#### [P2-2] Computer-use fallback

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: 双轨都失败时（Cloudflare、TikTok Shop 强反爬），无兜底
- **方案**: orchestrator.py 增加 fallback 决策树：

```python
if local失败 and apify失败:
    log.warning("双轨失败，fallback 到 native-devtools-mcp")
    # 调 native-devtools-mcp: take_screenshot + click + extract
    # 把结果回填到 ProductResult
```

- **价值**: 抓取成功率 80% → 95%+
- **工作量**: 1 天
- **依赖**: 需要先安装 `native-devtools-mcp` 或自建 browser-use fallback

---

### P3 — 跨境电商 SaaS 化

#### [P3-1] 拆分国际电商独立 MCP

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: 本项目国际电商抓取能力（Amazon/Shopee/Lazada/TikTok Shop）是 mcp-cn-commerce 没有的，可作为跨境 SaaS 入口
- **方案**: 拆出独立 MCP server（如 `escrape-intl`），加工具：
  - `amazon_search(keyword, marketplace)`
  - `amazon_bestsellers(category, max)`
  - `tiktok_shop_trending(country)`
  - `shopee_top_products(market, category)`
- **价值**: 跨境电商 SaaS 化（亚马逊代运营/TP 刚需）
- **工作量**: 1 周

#### [P3-2] 竞品报告生成 MCP tool

- **时间**: 2026-06-15
- **来源**: 会话 #1
- **背景**: `compare_view.py` 已有 HTML 对比视图能力，但需要手动调用
- **方案**:

```python
@mcp.tool()
async def generate_report(products: list[str], format: str = "html") -> str:
    """生成竞品对比报告（html/excel），Claude 一句话触发"""
```

- **价值**: 老板/运营直接要报告的场景
- **工作量**: 半天

---

### 架构级（横切关注点）

#### [A-1] MCP 工具标准化输出 schema

- **时间**: 2026-06-15
- **背景**: 现在 `scrape` / `my_product` 都返回 `json.dumps(result.to_dict())`，缺乏结构化 schema
- **方案**: 用 pydantic 定义 `MCPScrapeOutput` / `MCPMerchantOutput`，让 Claude 更易消费
- **价值**: 降低 Claude 解析成本，减少幻觉

#### [A-2] 资源管理（MCP Resources 而非 Tools）

- **时间**: 2026-06-15
- **背景**: 现在 `divergences()` / `list_platforms()` 都是 tool，本质是只读数据查询
- **方案**: 改成 MCP Resources（`scraper://divergences/{date}`），Claude 可订阅
- **价值**: 节省 token（按需加载），符合 MCP 设计意图

#### [A-3] 长任务进度推送

- **时间**: 2026-06-15
- **背景**: 批量抓 100+ URL 时 Claude 等结果超时
- **方案**: 用 MCP Progress notifications 推送进度
- **价值**: 改善大批量场景体验

#### [A-4] 输出存储到 SQLite 替代内存

- **时间**: 2026-06-15
- **背景**: 现在数据在内存，返回给 Claude 后就丢
- **方案**: 强制落 SQLite（已有 `sqlalchemy + aiosqlite` 依赖），Claude 通过 query 查历史
- **价值**: 历史数据可追溯、可对比、可分析

#### [A-5] 代理健康度检测自动降级

- **时间**: 2026-06-15
- **背景**: `proxy_doctor.py` 已写但只在 MCP 启动时弹窗一次
- **方案**: 每次抓取前自动 health_check，失败自动降级（直连 → 代理 → Apify）
- **价值**: 减少人工介入

---

## In Progress

<!-- 正在做 -->

---

## Done

<!-- 已完成 -->

---

## Wontfix

<!-- 不做的，记录原因 -->

---

## 想法池（随手记录，未分类）

<!-- 后续想到的点子直接 append 在这里，定期整理到 Todo -->

---

## 变更日志

| 日期 | 变更 |
|---|---|
| 2026-06-15 | 创建本文档；录入会话 #1 调研产出的全部改进建议 |
