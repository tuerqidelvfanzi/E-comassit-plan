# Agent 工具替代与降级规则（V3.0+）

> **作者**：维护于 2026-06-17
> **适用环境**：本项目 yitang-app + 全局 Claude Code
> **配套**：[FIX-WINDOWS-GBK-MOJIBAKE.md](./FIX-WINDOWS-GBK-MOJIBAKE.md) 汉字显示修复
> **生效位置**：`~/.claude/settings.json` → `systemPrompt` 字段（已 merge）

---

## 1. 为什么需要替代规则

本环境的 Claude 模型实际由 **MiniMax-M3** 驱动（`https://api.minimaxi.com/anthropic`），
不是 Anthropic 原生 Claude。这导致两个**必失败**的内置工具：

| 工具 | 现象 | 根因 |
|------|------|------|
| `WebSearch` | `API Error: 400 invalid params` | MiniMax 兼容层未实现 search 后端 |
| `WebFetch` | `Unable to verify if domain X is safe to fetch. ... blocking claude.ai` | WebFetch 抓取路径走 claude.ai 域名段，被安全策略拦截 |

**替代目标**：用本地已装的 anysearch skill + x-reader MCP 完全覆盖这两个工具的能力。

---

## 2. 替代工具表

| 原工具 | 一级替代 | 二级兜底 | 备注 |
|--------|---------|---------|------|
| `WebSearch`（通用搜索） | `anysearch search` | `mcp__x-reader__read_url`（仅当拿不到搜索结果时手抓搜索结果页）| anysearch 是真搜索引擎（api.anysearch.com） |
| `WebSearch`（垂直域：股票/学术/CVE/专利等）| `anysearch get_sub_domains` + 带 `--sub_domain` 的 `search` | — | 必先 get_sub_domains |
| `WebSearch`（多查询并行）| `anysearch batch_search --queries '[...]'` | 多次 `anysearch search` | 并行加速 |
| `WebFetch`（单个 URL）| `anysearch extract "https://..."` | `mcp__x-reader__read_url` | 抓取后返回 Markdown |
| `WebFetch`（多个 URL）| `mcp__x-reader__read_batch --urls [...]` | 多次 `anysearch extract` | |
| 平台识别 | `mcp__x-reader__detect_platform` | — | youtube/bilibili/twitter/wechat/xhs/telegram/rss/generic |

---

## 3. 调用模板（粘到对话里直接用）

### 3.1 通用搜索

```bash
python /c/Users/Barry.liang/.claude/skills/anysearch/scripts/anysearch_cli.py search "Claude Code settings.json best practice 2026" --max_results 5
```

### 3.2 抓取 URL

```bash
python /c/Users/Barry.liang/.claude/skills/anysearch/scripts/anysearch_cli.py extract "https://example.com/article"
```

### 3.3 并行多查询

```bash
python /c/Users/Barry.liang/.claude/skills/anysearch/scripts/anysearch_cli.py batch_search \
  --query "react server components 2026" \
  --query "vite 8 release notes" \
  --query "anthropic claude code 2.1" \
  --max_results 3
```

### 3.4 垂直域（金融股票示例）

```bash
# Step 1: 查可用子域
python /c/Users/Barry.liang/.claude/skills/anysearch/scripts/anysearch_cli.py get_sub_domains --domain finance

# Step 2: 用子域 + 必填参数搜索
python /c/Users/Barry.liang/.claude/skills/anysearch/scripts/anysearch_cli.py search "AAPL latest" \
  --domain finance --sub_domain finance.us_stock --sdp ticker=AAPL
```

### 3.5 兜底（仅 anysearch 不可用时）

```bash
# 单 URL
# 用 mcp__x-reader__read_url 工具

# 多 URL 并行
# 用 mcp__x-reader__read_batch 工具
```

---

## 4. 配套：GBK/MinTTY 汉字显示规则

> 详见 [FIX-WINDOWS-GBK-MOJIBAKE.md](./FIX-WINDOWS-GBK-MOJIBAKE.md) 方案 β

- **症状**：Win32 原生命令（where/ipconfig/systeminfo 等）输出 GBK 字节，MinTTY 按 UTF-8 解析显示为 `��` 乱码
- **已注入**（`~/.claude/settings.json`）：
  - `env`：`PYTHONIOENCODING=utf-8` / `PYTHONUTF8=1` / `LANG=zh_CN.UTF-8` / `LC_ALL=zh_CN.UTF-8` / `CHCP=65001`
  - `systemPrompt`：GBK 规则段（提醒 Claude 主动 iconv）
  - `hooks.SessionStart` 新增 `matcher: "startup"` 的 chcp 65001 钩子
- **已存在**（`~/.bashrc`，无需重复）：
  - `native-windows-utf8` 函数（动态检测 code page + 智能 iconv）
  - 8 个常用命令包装：`where.exe` / `tasklist.exe` / `sc.exe` / `systeminfo.exe` / `net.exe` / `ipconfig.exe` / `netsh.exe` / `reg.exe`
  - `whereu` 辅助函数
  - `LANG` / `LC_ALL` / `PYTHONIOENCODING` 导出

**规则**：看到 `��` / `???` 等乱码，**先 iconv 重新解码**，不要重跑命令。

---

## 5. 强依赖 / 弱依赖一览

| 服务 | 用途 | 是否需代理 | 备注 |
|------|------|:---:|------|
| `api.anysearch.com` | anysearch search/extract | ❌ 不需要 | 实测直连 200 OK |
| `api.github.com` | GitHub MCP（26 工具）| ❌ 不需要 | 实测直连 200 OK |
| `api.minimaxi.com` | Claude 模型本身 | ❌ 不需要 | 实测可达 |
| `claude.ai` | 域名被安全策略拦截 | — | WebFetch 走这里，**必失败** |
| `127.0.0.1:7890` | 用户级 WinINet 代理 | — | **当前 Claude 工作流不依赖**（Chrome 才用） |

---

## 6. 配置位置备忘（避免重复找）

| 配置 | 位置 | 说明 |
|------|------|------|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | `~/.claude.json` → `mcpServers.github.env` | 已经在用，**别再**塞到 settings.json |
| MiniMax 模型端点 + key | VSCode ext `claudeCode.environmentVariables`（数组）<br>+ `~/.claude/settings.json` → `env`（对象）| 重复声明，两个都得改才一致 |
| anysearch API key（可选） | `~/.claude/skills/anysearch/.env` 或 `ANYSEARCH_API_KEY` env | 匿名访问也可用，key 提升速率限制 |
| 代理（127.0.0.1:7890）| 暂未配置 | 暂不需要 |

---

## 7. 验证清单（修改后跑一遍）

```bash
# 1. 任何 search 替代 WebSearch
python /c/Users/Barry.liang/.claude/skills/anysearch/scripts/anysearch_cli.py search "test" --max_results 1

# 2. 任何 extract 替代 WebFetch
python /c/Users/Barry.liang/.claude/skills/anysearch/scripts/anysearch_cli.py extract "https://example.com"

# 3. JSON 语法
python -c "import json; json.load(open('C:/Users/Barry.liang/.claude/settings.json'))"

# 4. chcp hook 实际效果
cmd //c "chcp 65001 >nul 2>&1 & echo [encoding] session-start: ACP=65001"

# 5. GitHub MCP 仍然 OK
# （在 Claude Code 里用 mcp__github__list_issues 验证）
```

---

## 8. 故障排查

| 现象 | 原因 | 修复 |
|------|------|------|
| `WebSearch` 报 400 | MiniMax 端不通 | 改用 anysearch `search` |
| `WebFetch` 报 `blocking claude.ai` | 抓取路径被拦 | 改用 anysearch `extract` |
| `WebFetch` 报 `safe to fetch` | 同上 | 同上 |
| 任何 search/extract 报 `connection refused` | 任何 search API 挂了 | 用 mcp__x-reader__read_url 兜底，或 `Bash` + `curl` |
| 任何命令输出 `��` 乱码 | GBK 未转码 | `... 2>&1 \| iconv -f CP936 -t UTF-8//IGNORE`，或用 `native-windows-utf8 <cmd>` |
| GitHub MCP 报 `Not Found` | 路径错 | 公开仓库路径写对即可；私有仓库需要 token |
| Claude Code 启动白屏 | hooks 崩溃 | 删 `"hooks": {}` 重启（kill switch，见 `_hooks_doc`） |

---

## 9. 变更历史

| 日期 | 变更 | 作者 |
|------|------|------|
| 2026-06-17 | 初版：合并 GBK 修复方案 β + Web*/WebSearch 替代规则到 `~/.claude/settings.json` | Claude |
