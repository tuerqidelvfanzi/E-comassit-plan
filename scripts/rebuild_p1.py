#!/usr/bin/env python3
# rebuild_p1.py
from pathlib import Path
import re

ROOT = Path("d:/02-学习/06-yitang/app")
TARGET = ROOT / "docs/architecture-diagrams/电商助手架构图V1.0.0.drawio"
src = TARGET.read_text(encoding="utf-8")

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(chr(34), "&quot;")

def make_cell(nid, value, style, x, y, w, h, is_edge=False, src=None, tgt=None):
    if is_edge:
        return f'<mxCell id="{nid}" value="{esc(value)}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>'
    return f'<mxCell id="{nid}" value="{esc(value)}" style="{style}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

PW, PH = 3200, 3600  # 6 个说明面板，需要更高页面
COL_W = 420
GAP = 40
def CX(i): return 40 + i * (COL_W + GAP)

vs = "rounded=1;whiteSpace=wrap;html=1;fillColor={FCOL};strokeColor={SCOL};fontSize=12;fontColor=#333333;align=center;verticalAlign=middle;"
sl = "rounded=0;whiteSpace=wrap;html=1;fillColor={FCOL};strokeColor={SCOL};verticalAlign=top;align=left;fontSize=13;fontStyle=1;spacingLeft=8;spacingTop=6;"
nt = "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;fillColor=#fffbe6;strokeColor=#d6b656;fontSize=11;align=left;verticalAlign=top;spacingLeft=10;spacingTop=8;spacingRight=10;"

def vert(nid, val, fill, stroke, x, y, h=70):
    return make_cell(nid, val, vs.replace("{FCOL}", fill).replace("{SCOL}", stroke), x, y, COL_W-60, h)

def swim(nid, val, fill, stroke, x, y, h=660):
    return make_cell(nid, val, sl.replace("{FCOL}", fill).replace("{SCOL}", stroke), x, y, COL_W, h)

def note_cell(nid, val, x, y, h):
    return make_cell(nid, val, nt, x, y, PW-80, h)

parts = []
# Title
parts.append(f'<mxCell id="sg1" value="{esc("【页面 1/8】系统总览 — 跨境电商 AI 助手 V3.0 · 采集→处理→发布三段式")}" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f0f0f0;strokeColor=#999;verticalAlign=top;align=left;fontSize=13;fontStyle=1;spacingLeft=8;spacingTop=6;" vertex="1" parent="1"><mxGeometry x="40" y="30" width="{PW-80}" height="60" as="geometry"/></mxCell>')

# A — 4 类身份合并为 1 个分类描述节点
parts.append(swim("sg2", "A. 用户与角色", "#e8e8ff", "#5555aa", CX(0), 120))
parts.append(vert("n_a", "4 类身份：主操作员 / 团队主管 / 系统管理员 / 插件用户", "#e1d5e7", "#9673a6", CX(0)+30, 280, 90))

# B — 5 大源站 + 统一契约 合并为 1 个
parts.append(swim("sg_b", "B. 采集源站", "#fff2cc", "#d6b656", CX(1), 120))
parts.append(vert("n_b", "5 大国内电商（1688/淘宝/天猫/PDD/京东）\n统一契约：NormalizedProduct v1.0.0", "#fff2cc", "#d6b656", CX(1)+30, 240, 120))

# C — 浏览器插件 + Worker + 反爬 + 适配器 合并为 1 个
parts.append(swim("sg_c", "C. 采集侧（本系统自动抓取）", "#ffe6cc", "#d79b00", CX(2), 120))
parts.append(vert("n_c", "浏览器插件 MV3 v3.1 + Playwright Worker\n反爬 + 5 源适配器 L1→L4 自动降级", "#ffe6cc", "#d79b00", CX(2)+30, 240, 120))

# D — 前端 SPA 合并为 1 个
parts.append(swim("sg_d", "D. 前端 SPA（Web 工作台）", "#dae8fc", "#6c8ebf", CX(3), 120))
parts.append(vert("n_d", "Vite + React 19 + React Query + Zustand\n业务：采集箱 / 标题优化 / 发布 / 看板", "#dae8fc", "#6c8ebf", CX(3)+30, 240, 120))

# E — 后端 API 合并为 1 个
parts.append(swim("sg_e", "E. 后端 API（Hono + SQLite）", "#dae8fc", "#6c8ebf", CX(4), 120))
parts.append(vert("n_e", "Hono 4 + better-sqlite3 + jose\n51 路由 · 12 域 · 6 服务层 · 3 域逻辑", "#dae8fc", "#6c8ebf", CX(4)+30, 240, 120))

# F — 处理管线 合并为 1 个
parts.append(swim("sg_f", "F. 处理管线", "#e1d5e7", "#9673a6", CX(5), 120))
parts.append(vert("n_f", "5 阶段：Ingest → Normalize → Rewrite → Rules → Distribute\n输出 DraftListing（FillPayload）", "#e1d5e7", "#9673a6", CX(5)+30, 240, 120))

# G — 数据层 合并为 1 个
parts.append(swim("sg_g", "G. 数据层 + 监控 + 审计", "#d5e8d4", "#82b366", CX(6), 120))
parts.append(vert("n_g", "SQLite 16 表（WAL）+ 3 层日志 + dashboard metrics\n核心表：users / products / publish_tasks / audit_log", "#d5e8d4", "#82b366", CX(6)+30, 240, 120))

# Edges — 简单左到右流 A→B→C→D→E→F→G
P1 = "exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;"
edge_style = "endArrow=classic;html=1;rounded=0;strokeColor=#555;strokeWidth=1.5;fontSize=11;orthogonalEdgeStyle=1;{P}"

for eid, s, t, val in [
    ("e_ab", "n_a", "n_b", "登录"),
    ("e_bc", "n_b", "n_c", "DOM"),
    ("e_cd", "n_c", "n_d", "UPLOAD"),
    ("e_de", "n_d", "n_e", "JWT"),
    ("e_ef", "n_e", "n_f", "products"),
    ("e_fg", "n_f", "n_g", "写"),
]:
    parts.append(make_cell(eid, val, edge_style.replace("{P}", P1), 0, 0, 0, 0, is_edge=True, src=s, tgt=t))

# Notes (6 panels) — 业务层 + 技术层，每块 600-1000 字
NT_Y = 480
NT_H = 480
NT_W = PW - 80
GAP_NT = 20

nt1 = """【1. A. 用户与角色 — 4 类身份详细说明】

[业务层]
- 主操作员：日常使用 80% 时间的人。负责选品（看 1688 找爆款）、上架（推到 Shopee/TikTok）、看数据（看板）。
- 团队主管：管理 2-10 个主操作员。负责成员开通/停用、用量分配（每个成员每月多少条采集）、计费账单。
- 系统管理员：1-2 人。负责平台集成（注册 Shopee 开放平台拿到 Partner ID）、密钥轮换、LLM 接入配置。
- 插件用户：愿意装浏览器扩展的任何人。装一次插件，就可以在任何源站页面上点击"采集"，数据进自己的采集箱。

[技术层]
- users 表是核心（邮箱/手机号登录，bcrypt 存密码，2FA 短信/邮箱）
- teams 表支持一人多团队（主操作员加入团队 → 团队共享数据）
- extension_tokens 表存插件用户的 X-Ext-Token（bcrypt 哈希，永不过期）
- 主操作员 / 团队主管 / 系统管理员共用 users 表，role 字段区分
- 插件用户没有 user 账户，只在 extension_tokens 表里有记录（轻量身份）"""

nt2 = """【2. B. 采集源站 + C. 采集侧 — 本系统怎么"自动抓取"】

[业务层]
- 源站：5 大国内电商（1688 批发/淘宝 C 店/天猫品牌/PDD 拼好货/京东自营）。本系统只采这些，不采国外源（Shopee/TikTok 卖家中心是发布目标不是采集源）。
- 采集方式：① 浏览器插件（人在浏览时点击"采集"按钮）② Playwright Worker（无人在场时批量抓，比如凌晨定时拉新爆款）。两者都遵循同一份契约。
- 反爬：不是裸抓。UA 池轮换、IP 限速、人类行为伪装（随机滚动、点击间隔）。被源站风控时不强行重试，而是降级到 L4（fallback：只抓标题+主图）。

[技术层]
- 契约（NormalizedProduct v1.0.0）= 唯一事实源：source / sourceUrl / title / price{amount,currency} / images[] / skus[] / attributes / capturedAt / extractMethod(L1-L4) / extractLayer
- 4 层降级：L1 JSON-LD（最快）→ L2 meta 标签 → L3 DOM 选择器 → L4 仅标题图。每降一级成功率↑但字段↓
- 5 源适配器：每个源一个 collectAdapter.ts，注册到 collectAdapters Map
- 插件：extension/content_script/*.js + background service worker，Manifest V3
- Worker：worker/playwright/*.ts，独立 Node 进程，通过 API 入库
- 反爬：antiBan.ts（UA 池、限速、行为模拟）
- 失败兜底：UI 显示"采集失败"+ L4 简化版，运营可手工补全字段"""

nt3 = """【3. D. 前端 SPA + E. 后端 API — 系统骨架】

[业务层]
- 前端给谁用：主操作员（在浏览器里看采集箱、点发布）。不开源、不给客户用。
- 后端给谁用：插件（X-Ext-Token 调）、前端（JWT 调）、Worker（X-Ext-Token 调）。
- 鉴权：分人/分机。人用 JWT（登录后 7 天免登），机用 X-Ext-Token（永不过期可撤销）。敏感操作（如下发布）要求双验。
- 端到端：登录→可采集 < 1s。采集→入库 2-5s。改写→草稿 3-8s。发布→ACK 5-30s。

[技术层]
- 前端：Vite 6 + React 19 + React Query 5（服务端状态）+ Zustand 4（本地状态）+ React Router 7 + Tailwind v4 + shadcn/ui
- 后端：Hono 4（Node 22） + better-sqlite3（同步驱动，WAL 模式）+ jose（JWT 签发/验证）+ bcryptjs（密码哈希）+ Zod（请求体校验）
- 中间件链（按顺序）：CORS → 限流（5 rps/IP，5/min/批量） → 鉴权（jwtAuth/extensionAuth/chainVerify 三选一） → Zod 校验 → 业务路由 → 错误处理（5xx 自动 audit） → 响应包装
- 路由组织：12 域 × 平均 4 路由 = 51 路由。auth/extension/collect/products/publish/image/rule/insight/sku/category/team/dashboard
- 服务层 6 个：collectService / publishService / productService / authService / ruleService / metricsService
- 域逻辑 3 个：listing（重写+序列化）/ pipeline（5 阶段调度）/ shopee-bridge（发布消息协议）"""

nt4 = """【4. F. 处理管线 — 5 阶段改写流程】

[业务层]
- 采集到的"原始商品"不能直接发到 Shopee/TikTok，因为：① 标题太长（>100 字） ② 描述是中文（目标市场是越南/泰国） ③ 主图有水印 ④ 可能有违禁词 ⑤ 没有 SKU 编码。
- 处理管线做的就是"清洗+适配"：让一份中国电商的商品数据变成多市场可上架的标准品。
- 5 阶段顺序不可乱：先标准化（Ingest/Normalize）才能改写（Rewrite），先改写才能扫规则（Rules），先合规才能定价（Distribute）。
- 中间产物存内存（不落库），让运营可以预览/修改/确认后再决定是否进发布队列。

[技术层]
- 阶段 ① Ingest：把 products 表的 normalized_json 字段载入。决定改写哪些字段。
- 阶段 ② Normalize：清洗（去 emoji/HTML 实体/多余空白）、映射（颜色/尺码 → 平台术语）、兜底（缺字段从 attributes 推断）。
- 阶段 ③ Rewrite：调 LLM（gpt-4o-mini 为主）改写 title 和 description。市场规则：越南 Shopee 标题 ≤20 字（×3.5 字符数），泰国 TikTok 五段 SKU（BF-0001-PR-WH-S+B）。
- 阶段 ④ Rules：跑 rule_sets 表的规则（违禁词/类目模板/平台限制）。命中后插入 issues 表，warn 等用户确认，error 阻断。
- 阶段 ⑤ Distribute：按平台/市场序列化为 FillPayload（toShopeeListingVN / toTikTokListingTH），定价（汇率 + 加价系数），生成 SKU 6 段编码。
- 输出：DraftListing 内存对象。落库时机由用户点"确认发布"后转 publish_tasks。
- 引擎：runPipeline(engine.ts)，纯函数式（无副作用），易测试。
- 错误隔离：单条失败不影响其他条；error 阻断当前条，warn 等待确认。"""

nt5 = """【5. G. 数据层 + 三层日志 + 审计】

[业务层]
- 16 张表，覆盖 4 域：用户与认证（4 表）/ 采集与产品（3 表）/ 处理与发布（5 表）/ 系统与监控（4 表）。
- 三层日志让"一次任务"可完整回放：
  - audit_log（全局）：谁在什么时间做了什么，IP/UA 必填
  - bridge_events（采集/发布中段）：插件消息→响应，DOM 截图 base64
  - publish_logs（发布段）：每个步骤（点击/填表/上传图片/提交）的 step/level/message/timestamp
- 监控：dashboard/metrics 实时聚合任务成功率/改写耗时/发布耗时/失败原因 top10。

[技术层]
- 引擎：SQLite (WAL 模式) + better-sqlite3 同步 API。优点：单文件、零运维、备份=cp；缺点：单写者（接受，因单机部署）。
- 迁移：drizzle-kit + 自定义 migration runner，支持增量迁移。版本号存在 schema_migrations 表。
- 备份：每日 cron 拷贝 .db 到 S3，保留 30 天。
- 16 表：users / refresh_tokens / extension_tokens / teams / products / normalized_json（嵌入） / collect_jobs / publish_tasks / publish_logs / bridge_events / rule_sets / rule_items / issues / image_jobs / insight_jobs / audit_log / rate_limit / schema_migrations（实际是 18-20 张）。
- 核心查询：products by status (draft/pending/queued/running/success/failed/retrying)、publish_tasks 状态机（draft→queued→running→success/retrying/failed/manual_takeover）、audit_log 按 user_id+action 索引。
- 索引：products.source / products.status / publish_tasks.status / audit_log.(user_id, created_at) / extension_tokens.token_hash。
- 监控埋点：metrics 表（counter/gauge/histogram 三类），每分钟聚合一次。"""

nt6 = """【6. 三段式核心数据流 + 异常传播 + SLA 性能基线】

[业务层]
- 商品从源站到上架分三步：① 采集（5-30s）→ ② 处理（3-8s）→ ③ 发布（5-30s）。三段独立可中断。
- 异常传播：每段失败时记录到对应日志层 + audit_log + 通过 WebSocket 推送给前端实时刷新看板。运营可见"哪条卡在哪个阶段"。
- 跨段重试被禁止：避免已上架商品被反复提交产生重复单。只在本段内重试（最多 3 次，指数退避 1s/4s/16s）。
- 性能基线（生产 SLA）：
  - 登录到可采集：< 1s（缓存预热 JWT）
  - 单条采集到入库：2-5s（DOM 提取+网络+Zod 校验）
  - 改写到草稿：3-8s（LLM 调 gpt-4o-mini 为主，p95 8s）
  - 发布到 ACK：5-30s（DOM 填表+卖家中心响应）

[技术层]
- 采集段：源站 DOM → 扩展 A → chrome.runtime.sendMessage → API POST /collect-jobs → Zod 校验 → products 表 INSERT。批量场景走 Playwright Worker：worker/playwright/queue.ts 拉 batch_jobs，调 adapter，循环抓，最后批量入库。
- 处理段：runPipeline(engine.ts) 纯函数式调度 5 阶段。每阶段输出 intermediate state，error 阻断当前 draft，warn 写入 issues 表等运营确认。LLM 调用走 insight_jobs 异步队列（避免阻塞同步请求）。
- 发布段：DraftListing → domain/listing/serializer.ts 按平台序列化（toShopeeListingVN/toTikTokListingTH） → chrome.runtime.sendMessage 桥接 → 扩展 B 注入 publish-script.js → DOM 填表 → 抓取卖家中心 ACK → API PATCH /publish-tasks/:id。
- 异常监控：每段 try-catch + audit_log 双写 + publish_logs step trace。死信队列：连续失败 → dead_letter → 通知用户复制 raw JSON 手动粘贴 → 状态 manual_takeover。
- WebSocket 推送：前端订阅 /ws/dashboard，服务器端用 ws 库广播任务状态变更，前端 React Query 失效对应 query 触发重新拉取。
- 性能优化：① JWT 在前端缓存到 localStorage 减少 401 ② Zod schema 编译一次复用 ③ LLM 调用并行（标题+描述同时发）④ SQLite 启用 mmap 模式。"""

parts.append(note_cell("nt1", nt1, 40, NT_Y, NT_H))
parts.append(note_cell("nt2", nt2, 40, NT_Y + (NT_H + GAP_NT), NT_H))
parts.append(note_cell("nt3", nt3, 40, NT_Y + 2*(NT_H + GAP_NT), NT_H))
parts.append(note_cell("nt4", nt4, 40, NT_Y + 3*(NT_H + GAP_NT), NT_H))
parts.append(note_cell("nt5", nt5, 40, NT_Y + 4*(NT_H + GAP_NT), NT_H))
parts.append(note_cell("nt6", nt6, 40, NT_Y + 5*(NT_H + GAP_NT), NT_H))

new_p1 = (f'<diagram name="01-系统总览" id="01-系统总览">'
          f'<mxGraphModel dx="3000" dy="2000" grid="1" gridSize="10" guides="1" connect="1" '
          f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="{PW}" pageHeight="{PH}" math="0" shadow="0">'
          '<root><mxCell id="0"/><mxCell id="1" parent="0"/>'
          + "\n".join(parts) +
          '</root></mxGraphModel></diagram>')

p1_re = re.compile(r'<diagram\s+name="01-系统总览"[^>]*>.*?</diagram>', re.DOTALL)
m = p1_re.search(src)
if not m:
    raise SystemExit("P1 not found")
print(f"原 P1: {len(m.group(0)):,} chars")
new_src = src[:m.start()] + new_p1 + src[m.end():]
TARGET.write_text(new_src, encoding="utf-8")
print(f"新 P1: {len(new_p1):,} chars")
print(f"文件: {TARGET.stat().st_size:,} bytes")
