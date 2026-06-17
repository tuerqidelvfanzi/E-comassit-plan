# Claude Code Setup 官方插件 — 使用说明

> 版本信息：Anthropic 官方插件，发布于 2025-10-09（Claude Code 插件公测）。  
> 本文档归属：`docs/CLAUDE-CODE-SETUP-PLUGIN.md`  
> 适用项目：易塘 / yitang-app

---

## 1. 这是什么

`claude-code-setup` 是 **Anthropic 官方维护、由 Anthropic 认证** 的 Claude Code 插件，专门用于：

> **分析你的代码库，并给出"量身定制"的 Claude Code 自动化建议**，覆盖五大扩展点：
>
> 1. **MCP servers**（外部工具集成）
> 2. **Skills**（技能/能力）
> 3. **Hooks**（事件钩子）
> 4. **Subagents**（子代理）
> 5. **Slash commands**（斜杠命令）

它**只读取**项目（不会修改任何文件），通过分析 `package.json`、语言文件、目录结构等，输出"对当前项目最有价值"的扩展建议。例如：

- 检测到 React 项目 → 推荐 **Playwright MCP**
- 检测到鉴权代码 → 推荐 **security-reviewer subagent**
- 检测到 CI/CD 配置 → 推荐相应 hooks

官方页面：https://claude.com/plugins/claude-code-setup  
所属市场：`anthropics/claude-plugins-official`（官方 marketplace，共 119 个插件）

---

## 2. 前置条件

| 项 | 要求 |
|---|---|
| Claude Code 版本 | **v1.0.33 或更高**（`claude --version` 检查） |
| 启动方式 | 交互式启动 Claude Code（首次会自动注册官方 marketplace） |
| 网络 | 需要能访问 `github.com/anthropics/claude-plugins-official` |

---

## 3. 安装步骤（三选一）

### 方式 A：交互式 TUI（推荐新手）

在项目根目录启动 Claude Code 后，在会话内输入：

```
/plugin
```

进入插件管理器 → 选择 **Discover** 标签 → 搜索 `claude-code-setup` → 回车安装。

### 方式 B：一行命令（推荐熟手）

在 Claude Code 会话内执行：

```
/plugin install claude-code-setup@claude-plugins-official
```

> 官方 marketplace `claude-plugins-official` 在 Claude Code 首次交互式启动时**已自动注册**，无需再次 `marketplace add`。

### 方式 C：脚本/CI 场景

如果是非交互式环境（首次启动前未注册过官方 marketplace），先显式添加：

```
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install claude-code-setup@claude-plugins-official
```

### 安装范围

默认安装到 **用户级**（跨项目共用）。若希望"仅本项目可用"，在 TUI 中切换 `scope` 为 `project`，或：

```
/plugin install claude-code-setup@claude-plugins-official --scope project
```

项目级安装会将依赖写入 `.claude/settings.json`，可随 Git 提交，团队共享。

---

## 4. 使用方法

安装完成后，**直接用自然语言唤起**即可（无需斜杠命令）。任一以下提示词都会触发：

- `recommend automations for this project`
- `帮我设置 Claude Code`
- `这个项目应该用哪些 hooks？`
- `推荐适合本项目的 MCP servers`
- `what subagents should I use?`

### 输出粒度

| 提问方式 | 输出 |
|---|---|
| 笼统问题（"推荐自动化"） | 每类返回 **Top 1-2 个最高价值**建议 |
| 单类问题（"推荐 MCP servers"） | 该类返回 **3-5 个**详细建议 |

### 典型示例（本项目场景）

针对易塘项目（React 18 + TypeScript + Node.js + Chrome Extension MV3）：

```
> recommend automations for this project

可能建议：
  • MCP: playwright（React 端到端测试）
  • MCP: context7（按版本拉 React/Express 文档）
  • Skill: typescript-lsp（TS 智能补全）
  • Subagent: code-review（PR 审查）
  • Hook: security-guidance（编辑时安全提醒）
```

---

## 5. 在本项目的推荐组合

基于易塘项目栈（React 18 + TS + Express + Chrome Extension + Zustand + TailwindCSS），安装 `claude-code-setup` 后**优先关注**它对以下扩展点的建议：

| 类别 | 候选官方插件 | 用途 |
|---|---|---|
| MCP | `playwright` | Web/Extension 自动化测试 |
| MCP | `context7` | 最新版 React/Express 文档检索 |
| LSP | `typescript-lsp` | TS 代码智能（必装） |
| Subagent | `code-review` | PR 自动审查（含确信度过滤） |
| Subagent | `feature-dev` | 7 阶段功能开发工作流 |
| Skill | `frontend-design` | 高质量 UI 生成（避开 AI 通用风格） |
| Hook | `security-guidance` | 编辑时安全模式提醒（XSS/命令注入） |
| 文档 | `claude-md-management` | 维护本项目 `CLAUDE.md` 质量 |

> 是否安装这些**附加插件**由你决策——`claude-code-setup` 只负责给出建议，**不会自动安装**。

---

## 6. 常用管理命令

| 命令 | 作用 |
|---|---|
| `/plugin` | 打开插件管理器 TUI |
| `/plugin install <name>@<marketplace>` | 单条安装 |
| `/plugin marketplace list` | 列出已注册的 marketplaces |
| `claude plugin list` | 列出已安装插件 |
| `/reload-plugins` | 修改后热重载，无需重启 |

---

## 7. 注意事项

1. **安全提示**：`claude-code-setup` 由 Anthropic 官方维护、Anthropic Verified，可放心使用。其他第三方插件**安装前请检查仓库内容**。
2. **只读保证**：本插件不会修改你的源码或配置，只输出"建议清单"。
3. **设计规格保留原则**：根据本项目 `CLAUDE.md` 铁律，**采纳建议时应"追加"而非"替换"** 现有自动化配置。
4. **国内网络**：若 `marketplace add` 报网络错误，先确认能访问 `github.com`，或为 Git 配置 HTTPS 代理。

---

## 8. 参考链接

- 官方插件页：https://claude.com/plugins/claude-code-setup
- 官方 marketplace：https://github.com/anthropics/claude-plugins-official
- 插件机制文档：https://code.claude.com/docs/en/plugins
- 安装与发现：https://code.claude.com/docs/en/discover-plugins

---

## 9. VS Code 扩展中 `/plugin` 不可用时的绕行方案

### 9.1 问题与背景

在 VS Code 中通过 **Anthropic Claude Code 扩展** 启动 Claude Code 时，扩展内嵌了一个简化交互层，**不暴露 `/plugin` 这个 TUI 斜杠命令**。运行：

```
/plugin install claude-code-setup@claude-plugins-official
```

会被拒绝并提示：

```
/plugin isn't available in this environment.
```

这是 **VS Code 扩展的已知限制**（[anthropics/claude-code#8590](https://github.com/anthropics/claude-code/issues/8590)），不是网络问题、也不是 marketplace 问题。

### 9.2 关键事实（来自官方文档与源码）

1. **CLI 是完整功能的入口**。`claude plugin <subcommand>` 这一组命令提供了**非交互式**管理能力，可以完全绕开 TUI：
   - `claude plugin marketplace add <source>`
   - `claude plugin marketplace list`
   - `claude plugin install <plugin>[@<marketplace>] [--scope user|project|local]`
   - `claude plugin list / enable / disable / uninstall / update / validate`
2. **官方 marketplace 是自动注册的**。`claude-plugins-official` 在首次交互式启动 Claude Code 时会自动加入；**非交互首次启动**（或 CI/脚本）下可能没有，需要先 `claude plugin marketplace add anthropics/claude-plugins-official`。
3. **`.claude/settings.json` 中确实存在 `enabledPlugins` 与 `extraKnownMarketplaces` 字段**，但有重要限制：
   - 这两个字段 **只在「交互式信任仓库」事件触发时才被处理**（[alexey-pelykh 调查报告](https://gist.github.com/alexey-pelykh/566a4e5160b305db703d543312a1e686)）。
   - 在 VS Code 扩展里，**信任提示可能已被自动跳过**，所以即使用了 `extraKnownMarketplaces`，也不会自动 install（[anthropics/claude-code#32606](https://github.com/anthropics/claude-code/issues/32606) — 已被官方关闭为 "not planned"）。
   - 结论：**只编辑 `settings.json` 不能在 VS Code 扩展里直接生效**，必须借助 CLI 子命令。
4. **VS Code 扩展内嵌了一份 CLI 副本**，但要使用 `claude plugin` 子命令，需要**额外安装独立的 `claude` CLI**（`npm i -g @anthropic-ai/claude-code`），并在 Git Bash / Windows Terminal / PowerShell 中直接调用，与 VS Code 扩展并行运行。

### 9.3 至少 2 个可行方案（从最简到最完整）

> 推荐顺序：**方案 B（最小侵入）→ 方案 A（最完整）**。
> 方案 C 是兜底。

---

#### 方案 A（推荐，最完整）：安装独立 `claude` CLI 后用 CLI 子命令安装

**前提条件**

- Node.js 已就绪（你已安装）
- npm 全局目录可写（`C:\Users\Barry.liang\AppData\Roaming\npm`）
- 网络可达 `github.com` 与 `registry.npmjs.org`

**执行步骤（Git Bash）**

```bash
# 1. 安装独立 CLI（最新版，含 plugin 子命令）
npm install -g @anthropic-ai/claude-code

# 2. 验证
claude --version
# 期望: 2.x.y（含 claude plugin 子命令）

# 3. 在项目根目录添加官方 marketplace（项目级，便于团队共享）
cd "d:/02-学习/06-yitang/app"
claude plugin marketplace add --scope project anthropics/claude-plugins-official

# 4. 安装本项目重点插件
claude plugin install --scope project claude-code-setup@claude-plugins-official
claude plugin install --scope project typescript-lsp@claude-plugins-official
claude plugin install --scope project security-guidance@claude-plugins-official
claude plugin install --scope project claude-md-management@claude-plugins-official

# 5. 验证安装结果
claude plugin list
claude plugin marketplace list

# 6. （可选）切回 VS Code 扩展运行 Claude Code，斜杠命令已在插件管理器加载
#    注意: VS Code 扩展里的 /plugin TUI 仍然不可用，但插件的 /skills 已经自动可用。
```

**PowerShell 等价**

```powershell
npm install -g @anthropic-ai/claude-code
claude --version
cd "d:\02-学习\06-yitang\app"
claude plugin marketplace add --scope project anthropics/claude-plugins-official
claude plugin install --scope project claude-code-setup@claude-plugins-official
```

**验证方式**

```bash
# 列出本项目（project scope）已安装的插件
claude plugin list --json | head -100

# 应看到形如:
# {"name":"claude-code-setup","scope":"project","marketplace":"claude-plugins-official", ...}
```

**优点**

- 唯一**官方支持**的非 TUI 路径
- 写入 `.claude/settings.json` 的 `enabledPlugins`，可随 Git 提交给团队共享

**缺点**

- 需要全局 npm 安装；首次需要几分钟

---

#### 方案 B（最小侵入）：只编辑 `.claude/settings.json`，不装 CLI

> 适合"不想动 npm / CLI、只想标记意图"的情形。
> ⚠️ **重要警告**：根据 §9.2 第 3 条，**单靠这个文件不会触发自动安装**（[issue #32606](https://github.com/anthropics/claude-code/issues/32606)），但在**独立的 `claude` CLI 下次交互式启动**这个项目时，会被识别并提示。

**执行步骤**

把下列片段**追加**到 `d:\02-学习\06-yitang\app\.claude\settings.json` 的**根对象**（注意：不得修改现有 `permissions.allow` 数组）：

```json
{
  "extraKnownMarketplaces": {
    "claude-plugins-official": {
      "source": {
        "source": "github",
        "repo": "anthropics/claude-plugins-official"
      }
    }
  },
  "enabledPlugins": {
    "claude-code-setup@claude-plugins-official": true,
    "typescript-lsp@claude-plugins-official": true,
    "security-guidance@claude-plugins-official": true,
    "claude-md-management@claude-plugins-official": true
  }
}
```

**合并示例**（保留原有 permissions）：

```jsonc
{
  "permissions": {
    "allow": [
      // === 原有内容，原样保留 ===
      "Bash(python -c ' *)",
      "Bash(python \"D:/tmp/cursor-scan/scan_logs.py\")"
      // ... 其余条目 ...
    ]
  },
  // === 追加：插件声明（不会自动安装，但下次独立 CLI 启动时会识别）===
  "extraKnownMarketplaces": {
    "claude-plugins-official": {
      "source": { "source": "github", "repo": "anthropics/claude-plugins-official" }
    }
  },
  "enabledPlugins": {
    "claude-code-setup@claude-plugins-official": true,
    "typescript-lsp@claude-plugins-official": true,
    "security-guidance@claude-plugins-official": true,
    "claude-md-management@claude-plugins-official": true
  }
}
```

**验证方式**

- 打开独立的 `claude` CLI（即使没装，VS Code 扩展内的 Claude 会忽略 `enabledPlugins` 字段本身）
- 用 `Read` 工具或编辑器打开 `.claude/settings.json`，确认 JSON 合法（无尾逗号）
- 在 Git Bash 里运行 `python -c "import json; print(json.load(open(r'd:/02-学习/06-yitang/app/.claude/settings.json'))['enabledPlugins'])"`

**优点**

- 零安装、零风险
- 把"项目期望启用哪些插件"显式写入仓库，便于团队对齐

**缺点**

- **不会立即生效**（VS Code 扩展 / CI / headless 模式下都不会自动安装）
- 必须配合方案 A 或方案 C 才能真正启用

---

#### 方案 C（兜底）：在 Windows Terminal 跑独立 `claude` TUI

如果方案 A 安装 CLI 之后，**不想在 VS Code 扩展里用 Claude**，可以直接在 Windows Terminal / PowerShell / Git Bash 启动独立 CLI：

```bash
# Git Bash
cd "d:/02-学习/06-yitang/app"
claude
# 进入 TUI 后再使用:
#   /plugin install claude-code-setup@claude-plugins-official
#   /reload-plugins
```

或者一次性非交互安装：

```bash
cd "d:/02-学习/06-yitang/app"
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install claude-code-setup@claude-plugins-official
```

### 9.4 三方案对比

| 维度 | A. CLI 安装 | B. 只改 settings.json | C. 独立 TUI |
|---|---|---|---|
| 实际安装插件 | ✅ | ❌（仅声明意图） | ✅ |
| 需要 npm 全局安装 | ✅ | ❌ | ✅ |
| 适合 CI / 脚本 | ✅ | ⚠️（依赖外部 trigger） | ❌ |
| 与 VS Code 扩展并行 | ✅（技能共享） | ✅ | ❌（需切窗口） |
| 团队共享（commit settings.json） | ✅ | ⚠️（半成品） | ❌ |

### 9.5 推荐执行顺序

1. **方案 A**：在 Git Bash 跑 `npm i -g @anthropic-ai/claude-code && claude plugin install ...` — 真正把插件装上。
2. **方案 B（可选）**：在 `.claude/settings.json` 同步声明 `enabledPlugins`，随仓库 commit，让团队 clone 后也能识别。
3. 启动 VS Code 扩展，**直接用自然语言**（如 "推荐本项目适合的自动化"）即可触发 `claude-code-setup` 已注册的 skill（不需要 `/plugin` TUI）。

### 9.6 已知坑与排查

| 症状 | 原因 | 解决 |
|---|---|---|
| `claude: command not found` | npm 全局目录未在 PATH | 把 `C:\Users\Barry.liang\AppData\Roaming\npm` 加到系统 PATH，重开终端 |
| `claude plugin install` 报 `marketplace not found` | 官方 marketplace 没注册 | 先 `claude plugin marketplace add anthropics/claude-plugins-official` |
| 改完 `settings.json` 仍不生效 | VS Code 扩展不读 `enabledPlugins` 自动 install | 改用方案 A |
| 插件装上但 `/plugin-name:xxx` 找不到 | 未 `/reload-plugins` 或 VS Code 扩展未重启 | 在独立 CLI 里 `/reload-plugins`；VS Code 扩展重新加载窗口 |

### 9.7 本节参考链接

- 插件 CLI 子命令参考：https://jackdog668-claude-code.mintlify.app/commands/plugin
- 官方发现/安装文档：https://code.claude.com/docs/en/discover-plugins
- `extraKnownMarketplaces` 工作机制调查：https://gist.github.com/alexey-pelykh/566a4e5160b305db703d543312a1e686
- 相关 Issue：https://github.com/anthropics/claude-code/issues/32606 · https://github.com/anthropics/claude-code/issues/8590

