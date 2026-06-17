# Windows 原生命令 GBK 中文输出在 MinTTY 下的乱码问题 — 调研与方案对比

> **作者调研日期**：2026-06-17
> **适用环境**：Windows 11（中文系统区域）+ Git Bash (MinTTY, UTF-8) + Claude Code CLI / VS Code 扩展
> **核心症状**：`where.exe` / `ipconfig.exe` / `systeminfo.exe` / `reg.exe` / `tasklist.exe` / `sc.exe` / `net.exe` / `netsh.exe` 等 Win32 原生命令输出中文时，stdout 是 GBK/CP936 字节，MinTTY 把这些字节按 UTF-8 解码 → 显示成 `��Ϣ: ���ṩ��ģʽ�޷��ҵ��ļ���`。

---

## 1. 根因（一句话版）

MinTTY 是 Cygwin 提供的伪终端（pty），它与 Bash 之间是 raw byte pipe，**不走 conhost 的 `chcp`**。所以：

- `chcp 65001` 在 cmd 里能影响 conhost 托管的 Win32 进程输出，**但 Git Bash 子进程拿到的 stdout 始终是 OEM/ANSI code page 字节**（中文系统为 CP936/GBK）。
- MinTTY 自身的 `Charset=UTF-8` 只影响它把哪些字节**渲染成字符**，不会反推 Win32 进程主动改编码。
- 想解决，**唯一可靠手段**是在 Bash 这层把 GBK 字节重新 pipe 进 `iconv -f CP936 -t UTF-8//IGNORE` 再交给 MinTTY。

> 来源：mintty issue #463（charset GBK）、cygwin 邮件列表 2020-08、Cygwin-POSIX 解释、LCTT 与 SO 上多个 2024-2025 答复。

---

## 2. 调研关键发现（5 条）

| # | 发现 | 关键来源 |
|---|------|---------|
| 1 | Claude Code 的 `~/.claude/settings.json` 同时支持 `env`、`systemPrompt`、`permissions` 以及 `hooks`（含 `SessionStart` 事件），可在用户级一次性配置。`SessionStart` 的 matcher 接受 `startup / resume / clear / compact`。 | `code.claude.com/docs/en/hooks` 事件表；`code.claude.com/docs/en/settings` |
| 2 | `SessionStart` 钩子的 stdout 会被注入到对话上下文，等同于"项目级自动应用的 system prompt 片段"——但官方支持的项目级 `--append-system-prompt` 替代方案仍在 issue 跟踪。 | GitHub issue `anthropics/claude-code#25872`；Gist `eshaham/8e3b63fb…` |
| 3 | 微软官方建议"全局开启 UTF-8"走 `Settings → Time & language → Language & region → Administrative language settings → Change system locale → 勾选 Beta: Use Unicode UTF-8 for worldwide language support`，**注册表等价命令**：`reg add HKLM\SYSTEM\CurrentControlSet\Control\Nls\CodePage /v ACP /t REG_SZ /d 65001 /f`（需管理员，重启生效）。 | `learn.microsoft.com/.../use-utf8-code-page`；SO #269818 |
| 4 | `mintty Charset=GBK` 是**反向降级**：让 MinTTY 把字节当 GBK 渲染，所有 UTF-8 文件 / 第三方 UTF-8 命令输出会同步变乱。mintty 官方从未推荐把 Charset 切到 GBK。 | mintty issue #463（closed，wontfix）；`mintty.1.html` |
| 5 | 用户 `~/.bashrc` 中已有的 `native-windows-utf8` 包装函数 + 8 个命令 override + `LANG/LC_ALL/PYTHONIOENCODING` 导出方案**仍是社区共识**；可用 `DEBUG trap` 或 `precmd` 让任意未列出的 `.exe` 命令也走 `iconv`，覆盖比白名单更全。 | Programmer Sought、aliyun topic、SO #57131654 |

> 备注：alexey-pelykh 的 gist 与本主题相关性弱（实际是 `extraKnownMarketplaces` 调查），已弃用。

---

## 3. 三套方案对比

> 推荐组合：**方案 α（基线）** + **方案 β（强化）**，按需追加**方案 δ（彻底）**。
> **方案 γ** 几乎在所有对比维度都劣于 α，不推荐。

### 3.1 方案 α —— 仅 `~/.bashrc` 增强（shell 级最小侵入）

**思路**：复用现有 `native-windows-utf8` + 8 命令 override，再补一个 `DEBUG trap` 让所有未列出的 `.exe` 命令也走 iconv。

**改动文件清单**

| 路径 | 类型 |
|------|------|
| `C:\Users\Barry.liang\.bashrc` | 追加 / 改 |

**具体改动（可粘贴）**

```bash
# === 已有：native-windows-utf8 + 8 命令 override + LANG/LC_ALL/PYTHONIOENCODING ===
# （保持现状不动）

# === 新增：DEBUG trap 让任何未列出的 .exe 命令也走 iconv ===
# 仅对"被 MinTTY pipe 接管"的 .exe 输出做 GBK→UTF-8 转码
_iconvify() {
  local cmd=$1
  case "$cmd" in
    *.exe|*.cmd|*.bat|"") return 0 ;;
  esac
  return 0
}

__gbk2utf8() {
  # stdin 来自 win32 .exe 时尝试转码；已经是 UTF-8 时 iconv -t UTF-8//IGNORE 安全空操作
  iconv -f CP936 -t UTF-8//IGNORE 2>/dev/null || cat
}

# 兜底：给剩余未 override 的常见命令加 alias
alias chcp="chcp.com 2>&1 | __gbk2utf8"
alias wmic="wmic.exe 2>&1 | __gbk2utf8"
alias powershell="powershell.exe -NoProfile -OutputFormat UTF-8 2>&1 | __gbk2utf8"
# ... 按需追加

# DEBUG trap 会捕获每个简单命令，函数内部判断：若该命令是 .exe/.cmd/.bat
# 且其输出当前仍在 pipeline 中，wrap 一层 iconv
__win32_wrap_debug() {
  # $BASH_COMMAND 在 DEBUG trap 中是即将执行的命令字符串
  case "$BASH_COMMAND" in
    *".exe"*|*".cmd "*|*".bat "*)
      # 透明改写：把"foo.exe args"重定向到子 shell 跑 iconv
      eval "$(printf '%s' "$BASH_COMMAND" | sed -E 's|^(.*\.(exe\|cmd\|bat))( .*)?$|__gbk2utf8 <<< "$(\\1\\3 2>&1)"|')"
      return 1   # 阻止原命令执行
      ;;
  esac
  return 0
}
# trap -p DEBUG  # 注意：DEBUG trap 在交互 shell 中不递归触发函数体，安全。
# 如担心误伤可改用 precmd：
# precmd() { :; }
```

> ⚠️ 上面 `DEBUG trap` 改写仅作示意，**真正可投产的写法是白名单 alias**（`__gbk2utf8` 函数 + `alias`）。trick 越多坑越多。

**实用建议**（推荐替代上面的 trap 写法）：

```bash
# 把"白名单"做成数据驱动，后续只改数组就行
__gbk_commands=(where ipconfig systeminfo reg tasklist sc net netsh wmic wevtutil sc query powercfg bcdedit)
for c in "${__gbk_commands[@]}"; do
  alias "$c"="$c.exe 2>&1 | __gbk2utf8"
done
```

**评分**

| 维度 | 评分 (1-5) | 说明 |
|------|------------|------|
| 轻量级 | 5 | 改动只在 `~/.bashrc`，几行 alias |
| 全覆盖 | 3 | 只覆盖 Git Bash；cmd / PowerShell / Windows Terminal 仍乱码 |
| 风险 | 低 | 不动系统注册表，不影响其他软件 |

**落地提示词方式**

- 选 **`~/.claude/CLAUDE.md` 段落** —— 让 Claude 知道"用户的 Windows 是 GBK + MinTTY，看到乱码要主动 iconv"。

---

### 3.2 方案 β —— α + `~/.claude/settings.json` 注入（推荐 ⭐）

**思路**：方案 α 做兜底，再在 Claude Code 用户级配置里：
1. `env` 注入 `PYTHONIOENCODING`、`LANG`、`LC_ALL` 等，让 Claude Code 的所有子进程（含 Bash 工具）默认 UTF-8。
2. `systemPrompt` 写一段 GBK 根因说明，强制 Claude 在所有 Bash 调用中主动防错。
3. `hooks.SessionStart` 跑一个 `chcp 65001` + 输出 GBK 提示，确保任何 shell 启动时编码统一。

**改动文件清单**

| 路径 | 类型 |
|------|------|
| `C:\Users\Barry.liang\.bashrc` | 同方案 α |
| `C:\Users\Barry.liang\.claude\settings.json` | 合并（merge，不替换） |

**`~/.claude/settings.json` 关键 diff（增量）**

```jsonc
{
  // 你现有的字段保持不变，下面只展示新增

  "env": {
    "PYTHONIOENCODING": "utf-8",
    "PYTHONUTF8": "1",
    "LANG": "zh_CN.UTF-8",
    "LC_ALL": "zh_CN.UTF-8",
    "CHCP": "65001"
  },

  "systemPrompt": "## Windows GBK / MinTTY 编码（用户固定背景）\n\n本机环境：Windows 11 中文系统 + Git Bash (MinTTY, UTF-8)。所有 Win32 原生命令（where / ipconfig / systeminfo / reg / tasklist / sc / net / netsh / wmic / wevtutil / chcp / powercfg / bcdedit 等）的 stdout 是 GBK/CP936 字节；MinTTY 按 UTF-8 解析会显示为 `��` 乱码。\n\n规则：\n1. 调用上述命令时，**默认把输出 pipe 给 `iconv -f CP936 -t UTF-8//IGNORE`** 再让 Claude 读取。\n2. 用户环境已配置 `~/.bashrc` 中的 `__gbk2utf8` 与白名单 alias，可直接调用。\n3. 看到 `��` / `???` 等乱码模式，**第一时间主动用 `iconv -f CP936 -t UTF-8//IGNORE` 重新解码**，不要反复重跑命令。\n4. 不要建议用户改 Windows 系统区域为 UTF-8（属于系统级变更，需用户明确同意）。",

  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "cmd //c \"chcp 65001 >nul 2>&1 & echo [encoding] session-start: ACP=65001\""
          }
        ]
      }
    ]
  }
}
```

> 📌 `env` 字段在 Claude Code 子进程（含 Bash 工具）启动时会被注入；`systemPrompt` 会被拼到 Claude 的 system prompt；`SessionStart` 的 stdout 会进入上下文。
> 📌 matcher `startup` 表示新会话开始时触发；`resume / clear / compact` 可按需追加（resume 通常要保留上下文，**不建议在 resume 时也注入 chcp 噪声**）。

**评分**

| 维度 | 评分 (1-5) | 说明 |
|------|------------|------|
| 轻量级 | 4 | 一个文件 + 几行配置 |
| 全覆盖 | 4 | 覆盖 Claude Code + Bash；cmd / PowerShell 仍部分需依赖 α |
| 风险 | 低 | `env` / `systemPrompt` 都是声明式；hook 只在 startup 跑一次 `chcp` |

**落地提示词方式**

- 选 **`systemPrompt` 字段 + `env` 字段 + `hooks.SessionStart` 组合** —— 既修正子进程编码，又把规则钉到 Claude 脑里。

---

### 3.3 方案 δ —— Windows 11 Beta UTF-8 全局开启（最彻底）

**思路**：用 `reg add` 把 `HKLM\SYSTEM\CurrentControlSet\Control\Nls\CodePage\ACP` 改成 `65001`，等效于勾选"区域 → 更改系统区域设置 → Beta: Use Unicode UTF-8 for worldwide language support"。**所有 Win32 进程默认 UTF-8 输出**，根本不需要 iconv wrapper。

**改动命令（管理员 PowerShell / cmd）**

```cmd
:: 需管理员
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Nls\CodePage" /v ACP /t REG_SZ /d 65001 /f
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Nls\CodePage" /v OEMCP /t REG_SZ /d 65001 /f
shutdown /r /t 0   :: 必须重启
```

**GUI 等价**

`Settings → Time & language → Language & region → Administrative language settings → Change system locale… → 勾选 "Beta: Use Unicode UTF-8 for worldwide language support" → OK → 重启`

**评分**

| 维度 | 评分 (1-5) | 说明 |
|------|------------|------|
| 轻量级 | 2 | 两条 reg + 重启，影响全局 |
| 全覆盖 | 5 | 任何 Win32 进程、任何终端（cmd / PowerShell / WT）都覆盖 |
| 风险 | **中-高** | 部分依赖 GBK 的老程序（部分游戏、部分 PDF 阅读器、部分企业 ERP 客户端）会乱码；微软官方仍标记 Beta |

**落地提示词方式**

- 选 **`~/.claude/CLAUDE.md` 段落** —— 写入"系统已切到 UTF-8，但仍需注意某些老 GBK 程序"。

---

### 3.4 方案 γ（不推荐，仅作记录）—— mintty Charset = GBK

把 MinTTY 自身 `Charset=GBK` 渲染，**所有** UTF-8 来源（`cat .md` / `cat .json` / Python `print()` / Node stdout / Git 日志）同步变乱。**放弃通用 UTF-8 来适配单一场景**，强烈不推荐。

---

## 4. 横向对比表

| 维度 | α  bashrc-only | β  α + settings.json | γ  mintty Charset=GBK | δ  Windows Beta UTF-8 |
|------|----------------|----------------------|----------------------|------------------------|
| 轻量 | ★★★★★ | ★★★★ | ★★★★★ | ★★ |
| 全覆盖 | ★★★ | ★★★★ | ★★（破坏 UTF-8） | ★★★★★ |
| 风险 | 低 | 低 | 中（破坏 UTF-8 显示） | 中-高（影响老 GBK 程序） |
| 是否需管理员 | 否 | 否 | 否 | 是 |
| 是否需重启 | 否 | 否 | 否 | 是 |
| 对其他软件影响 | 无 | 无 | 高（破坏 UTF-8 通用显示） | 中（部分老程序乱码） |
| 落地复杂度 | 5 分钟 | 10 分钟 | 1 分钟 | 30 分钟 + 重启 |

---

## 5. **推荐方案**：方案 β（α 兜底 + settings.json 注入）

**理由（一句话）**：

> 方案 β 在**不改系统、不破坏 UTF-8 通用显示**的前提下，覆盖了 Claude Code 子进程（`env`）+ Claude 行为（`systemPrompt`）+ 会话启动期（`SessionStart`），把"用户是 GBK + MinTTY"这一固定背景钉到了 Claude 的工作记忆里，**自适应"看到乱码就 iconv"**，与方案 α 的白名单 alias 互为冗余。

**落地步骤（按顺序）**

1. **方案 α（bashrc）**：在 `~/.bashrc` 追加 `__gbk2utf8` 函数 + 14 个常用命令 alias（where / ipconfig / systeminfo / reg / tasklist / sc / net / netsh / wmic / wevtutil / chcp / powercfg / bcdedit / sc query）。
2. **方案 β（settings.json）**：在 `~/.claude/settings.json` 合并 `env` + `systemPrompt` + `hooks.SessionStart` 三段（见 §3.2 完整 JSON）。
3. **不推荐**直接做方案 δ（系统级 Beta UTF-8）—— 留给将来真有全局需求时再开。

---

## 6. 完整 diff 模板（用户确认后我会去改的文件）

### 6.1 `C:\Users\Barry.liang\.bashrc` 增量

```bash
# === 新增区块：GBK -> UTF-8 通用 wrapper（追加在已有 LANG/LC_ALL/PYTHONIOENCODING 之后）===

# 通用转码函数：把 GBK 字节流变 UTF-8；UTF-8 输入走 //IGNORE 安全
__gbk2utf8() {
  iconv -f CP936 -t UTF-8//IGNORE 2>/dev/null || cat
}

# 数据驱动的白名单 alias，后续增删只改这里
__gbk_commands=(
  where ipconfig systeminfo reg tasklist sc net netsh
  wmic wevtutil chcp powercfg bcdedit
)
for _c in "${__gbk_commands[@]}"; do
  # 已存在的 alias 不覆盖
  alias "$_c"="command $_c.exe 2>&1 | __gbk2utf8" 2>/dev/null
done
unset _c __gbk_commands
```

### 6.2 `C:\Users\Barry.liang\.claude\settings.json` 增量（合并到现有文件）

> ⚠️ **不要**直接覆盖你现有 `settings.json`，只 merge 以下三个 key：

```jsonc
{
  "env": {
    "PYTHONIOENCODING": "utf-8",
    "PYTHONUTF8": "1",
    "LANG": "zh_CN.UTF-8",
    "LC_ALL": "zh_CN.UTF-8",
    "CHCP": "65001"
  },

  "systemPrompt": "## Windows GBK / MinTTY 编码（用户固定背景）\n\n本机：Windows 11 中文系统 + Git Bash (MinTTY, UTF-8)。Win32 原生命令 stdout 是 GBK/CP936 字节，MinTTY 按 UTF-8 解析显示为 `��` 乱码。\n\n规则：\n1. 调用 where/ipconfig/systeminfo/reg/tasklist/sc/net/netsh/wmic/wevtutil/chcp/powercfg/bcdedit 等时，**默认把输出 pipe 给 `iconv -f CP936 -t UTF-8//IGNORE`** 再读。\n2. 用户 `~/.bashrc` 已配置 `__gbk2utf8` 与白名单 alias，可直接调用。\n3. 看到 `��` / `???` 模式，**先 iconv 重新解码**，不要重跑命令。\n4. 不要建议用户改 Windows 系统区域为 UTF-8（系统级变更，需用户明确同意）。",

  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "cmd //c \"chcp 65001 >nul 2>&1 & echo [encoding] session-start: ACP=65001\""
          }
        ]
      }
    ]
  }
}
```

---

## 7. 候选"系统级提示词"模板（按 §5 方案 β 用）

### 7.1 候选 A —— 轻量 `~/.claude/CLAUDE.md` 段落（跨项目生效）

```markdown
# Windows GBK / MinTTY 编码（用户固定背景）

- **环境**：Windows 11 中文系统 + Git Bash (MinTTY, UTF-8)。
- **症状**：Win32 原生命令（where / ipconfig / systeminfo / reg / tasklist / sc / net / netsh / wmic / wevtutil / chcp / powercfg / bcdedit 等）输出 GBK/CP936 字节，MinTTY 按 UTF-8 解析显示为 `��` 乱码。
- **根因**：MinTTY 是 raw pipe，不走 conhost 的 `chcp`。
- **规则**：
  1. 调用上述命令时默认 `... 2>&1 | iconv -f CP936 -t UTF-8//IGNORE`。
  2. 看到乱码模式（`��` / `???`）先 iconv 再读，不要重跑命令。
  3. 不要建议改系统区域为 UTF-8（系统级变更）。
```

### 7.2 候选 B —— `systemPrompt` 字段专用段（与 §6.2 一致，已含）

见 §6.2 中 `systemPrompt` 字段内容；本节不重复。

### 7.3 候选 C —— `SessionStart` hook 输出（更轻量、自解释）

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "cmd //c \"chcp 65001 >nul 2>&1 & echo ### Windows encoding: ACP=65001 (UTF-8). Win32 cmd outputs are GBK/CP936. Pipe through: iconv -f CP936 -t UTF-8//IGNORE\""
          }
        ]
      }
    ]
  }
}
```

> 候选 C 比 7.1 / 7.2 都轻量；每次新会话第一条 user prompt 之前会把这段提示注入上下文。**不写文件、不改 settings 其它部分**——只新增一个 hook。

---

## 8. 用户下一步

请选择其一，我会按选定方案去改你的**用户级**配置（**不动项目级任何文件**）：

| 选项 | 含义 | 落地文件 |
|------|------|----------|
| **A：方案 α** | 仅 `~/.bashrc` 增强 | `C:\Users\Barry.liang\.bashrc` |
| **B：方案 β**（推荐） | α + `~/.claude/settings.json` 注入 | `~/.bashrc` + `~/.claude/settings.json` |
| **C：方案 β-mini** | 只在 `settings.json` 加 `SessionStart` hook 输出（候选 C） | `~/.claude/settings.json`（最小侵入） |
| **D：方案 δ** | 全局开 Windows Beta UTF-8 | 注册表（需管理员 + 重启） |
| **E：先看不动** | 仅保存本调研 | 无 |

> 选好后告诉我，我会按 §6 的 diff 模板直接 merge，**不会**改你项目目录里任何文件。

---

## 9. 风险与兼容性备忘

- **`chcp 65001` 在 Claude Bash 子进程中的副作用**：chcp 本身输出是 GBK，被 MinTTY 读仍然乱——所以**不在 Bash 里用 chcp**，而是用 `cmd //c` 包一层在 hook 里跑。
- **`LANG=zh_CN.UTF-8` 对 Python 2 / 老 Ruby 的影响**：少量老脚本会因 locale 不识别报错。如果出现，把 `LC_ALL` 单独 export 即可。
- **SessionStart hook 的 stdout 长度**：单次建议 < 200 字符，太长会污染上下文。候选 C 已控制。
- **matcher 选 `startup` 而非 `*`**：避免 `resume / clear / compact` 时重复注入噪声。
- **方案 δ 注册表改动不可逆性**：改 `ACP=65001` 后部分中文路径老游戏 / 老 ERP 会乱，需手动改回 `936`。**务必**先确认没有遗留依赖 GBK ANSI API 的软件再开。

---

## 10. 参考链接

- Claude Code 官方文档：
  - Settings：https://code.claude.com/docs/en/settings
  - Hooks：https://code.claude.com/docs/en/hooks
- SessionStart 注入特性讨论：https://github.com/anthropics/claude-code/issues/25872
- SessionStart 实战示例：https://gist.github.com/eshaham/8e3b63fb077530dffc2964b648145ec9
- Microsoft 官方：Use UTF-8 code pages in Windows apps — https://learn.microsoft.com/en-us/windows/apps/design/globalizing/use-utf8-code-page
- mintty Charset 行为：https://github.com/mintty/mintty/issues/463
- mintty 选项参考：https://mintty.github.io/mintty.1.html
- 中文乱码背景讨论：https://unix.stackexchange.com/questions/785265/is-it-possible-to-make-windows-git-bash-support-chinese
- Cursor 论坛同类问题：https://forum.cursor.com/t/agent-write-strreplace-tools-output-gbk-encoded-files-on-chinese-windows-persists-in-3-0-13-even-after-acp-changed-to-65001/157128

---

> **本文档仅为调研报告 + 方案对比。** 任何对 `~/.bashrc` / `~/.claude/settings.json` / Windows 注册表的实际改动，将在用户明确选择方案后再执行。
