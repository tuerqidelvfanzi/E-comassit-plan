# yitang 项目会话归档协议
# 位置: 项目根 .claude/archive-protocol.md (跟项目走, 移动后跟着走)
# 性质: 协议文档, 不是配置源. 任何 agent / hook 实现归档时必须遵守.
# 调研日期: 2026-06-17

# ============================================================================
# §1. 核心问题
# ============================================================================
用户问过: "如果加了'本会话归档'触发词, 过程中又说'记录到 obsidian', 最后是否会成为两个会话?"

答案: 取决于去重机制. 调研发现:
- **所有主流 obsidian-mcp 工具都不内置 session_id / 去重** (write_note 无此概念)
- 工具层不可信, **去重必须由调用方 (hook / 脚本) 实现**
- vault_doctor (abhattacherjee/obsidian-brain issue #81) 证明: 仅靠 session_id 单一字段去重不够, 会有静默 last-write-wins 风险

# ============================================================================
# §2. 触发词 (L1 精确化)
# ============================================================================
只在 UserPromptSubmit hook 检测到以下触发词时启动归档:

| 触发词 | 行为 | 同义/混淆 |
|---|---|---|
| `本会话归档` | 归档整段对话 (full) | 包含 `归档本会话` |
| `本段归档` | 归档指定段 (segment) | 包含 `归档本段` |
| `追加到 obsidian` | append (在今日 daily note 末尾追加 summary) | 显式追加意图 |
| `覆盖到 obsidian` | overwrite (更新已存在的归档 note) | 显式覆盖意图 |
| **不**触发 | — | `obsidian 怎么用` / `obsidian 配置` / `看 obsidian` / `obsidian 怎么装` 等 |

实现: safe_hook.py 加关键词精确匹配 (白名单), 不要用 fuzzy / substring.

# ============================================================================
# §3. 路径策略 (核心: 路径确定性 = 天然去重)
# ============================================================================
参考 afgallo/claude-session-to-obsidian (黄金标准实现):

```
完整会话 note:
  Claude Sessions/{year}/{month}/{YYYY-MM-DD-HHMM}-{slug}.md
  例: Claude Sessions/2026/06/2026-06-17-1730-修复minimax-env传递问题.md

daily note 追加:
  (动态路径) 2026-06-17.md  →  ## Claude Sessions 段下追加一行
```

为什么用 `YYYY-MM-DD-HHMM-{slug}`:
- 同 session 重新 export 路径相同 → write_note overwrite 覆盖, **天然 idempotent**
- 不同 session 即使主题相同, HHMM 不同 → 不会冲突
- slug 来自 summary 前 60 字符, 人类可读, 便于搜索

frontmatter 必须含:
```yaml
---
type: claude-session
session_id: <harness-uuid>     # 唯一
date: DD/MM/YYYY
time: HH:MM
project: <cwd basename>         # e.g. "app"
message_count: N
status: completed
---
```

# ============================================================================
# §4. 去重逻辑 (3 层防护)
# ============================================================================
## §4.1 L1 触发词层
只在白名单触发词出现时启动 (见 §2). 避免误触发.

## §4.2 L2 调用方层 (核心: session_id + 时间戳)
写在 auto memory (跟项目走):

```
~/.claude/projects/<proj>/memory/.archived_sessions.json
{
  "<session_id>": {
    "last_message_at": "ISO8601",
    "obsidian_path": "Claude Sessions/2026/06/...md",
    "archive_count": N  // 可选, 用于"同一 session 多次触发"的追踪
  }
}
```

写入逻辑:
```python
def should_archive(session_id, current_msg_at):
    record = load_record(session_id)
    if record is None:
        return WRITE  # 第一次
    if current_msg_at > record['last_message_at']:
        return UPDATE  # 新消息, 覆盖
    return SKIP        # 旧消息, 跳过
```

## §4.3 L3 工具层 (辅助: collision 检测)
参考 vault_doctor issue #81 的"degrade gracefully"原则:

写 obsidian 后, 调 search_note 查 frontmatter.session_id == current_session_id:
- 0 个结果: 正常, 单条 note
- 1 个结果: 正常, 单条 note (刚写的)
- **>=2 个结果: collision, 走"合并"而非"再覆盖"**:
  - 把多条 note 的 frontmatter 合并
  - 在末尾追加 ## Merge marker 段, 写明合并时间
  - 不删任何一条 (保留历史)
  - 在 stderr emit "COLLISION_DETECTED" 警告

## §4.4 失败模式 (what if 都不工作?)
如果 L2 + L3 都失败 (memory 被清, search_note 不可用):
- **写后必查**: 写完一次 search_note 验证只有 1 条
- 失败时: 不写第二次, 提示用户手动合并

# ============================================================================
# §5. 实施步骤
# ============================================================================
1. **装 obsidian-mcp** (推荐 quinny1187/obsidian-mcp, 安装最简):
   - 包: mcp-obsidian (npm) 或 mcpvault (Python 改进 fork)
   - env: OBSIDIAN_VAULT=<vault 绝对路径>
   - 启动: `node dist/index.js` 或 `uvx mcpvault`
2. **写 safe_hook.py 扩展**:
   - UserPromptSubmit: 检测触发词 (§2) → 启动归档流程
   - SessionEnd (可选 stage_3): 自动归档结束时的 session
3. **第一次手动验证**:
   - 启动新 session 装 mcp
   - 输 "本会话归档" 看是否触发
   - 输 "本会话归档" 再一次看是否 UPDATE / SKIP
   - 查 obsidian vault 看路径是否按 §3 规则生成

# ============================================================================
# §6. 关键设计原则
# ============================================================================
1. **路径确定性优先**: 路径设计保证 idempotent (§3), 这是兜底
2. **session_id 写入 frontmatter**: 便于检索 (§3 + §4.3)
3. **collision 检测 (L3)**: 写后必查 search_note, >=2 条走合并 (不删)
4. **触发词白名单 (L1)**: 严格精确匹配, 不 fuzzy
5. **auto memory (L2)**: 跟项目走, 单一来源
6. **vault_doctor 教训**: 不要 `dict[sid] = p` 简单赋值, 一定要 collision set 检测

# ============================================================================
# §7. 元信息
# ============================================================================
version: 1
created: 2026-06-17
调研来源:
  - quinny1187/obsidian-mcp (write_note schema)
  - iansinnott/obsidian-claude-code-mcp (305 stars, Obsidian 插件方案)
  - bitbonsai/mcp-obsidian (mcpvault 改进 fork)
  - afgallo/claude-session-to-obsidian (SessionEnd hook 黄金标准)
  - abhattacherjee/obsidian-brain issue #81 (vault_doctor collision 教训)

related:
  - ".claude/path-manifest.yaml" (本项目路径知识库)
  - "~/.claude/CLAUDE.md 子任务管理" (hook 实现约束)
