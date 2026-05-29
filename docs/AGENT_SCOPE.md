# 多智能体协作：如何单独指代 A / B

在 Cursor、Claude、Copilot 等里指派任务时，用 **固定代号 + 目录边界 + 禁止项**，避免改错仓库区域。

---

## 1. 推荐代号（团队统一用这套）

| 代号 | 全称 | 仓库路径 | 一句话 |
|------|------|----------|--------|
| **Scope-A** / **插件端** / **ext** | 浏览器插件 | `extension/` | 1688/淘宝采集、分层提取、上传 |
| **Scope-B** / **Web端** / **web** | B 站前端 | `web/` | 采集箱、工作台、设置、未来 API |
| **Scope-Contract** / **契约** | 跨端契约 | `docs/COLLECT_SCHEMA.md` + `shared/schemas/` | 两边都必须遵守的数据格式 |

不要说「改一下采集」——要说 **Scope-A 采集提取** 或 **Scope-B 采集箱导入**。

---

## 2. 复制即用的提示词模板

### 只让智能体做插件（A）

```text
【Scope-A · 插件端 only】
仓库：E-comassit-plan
只允许修改：extension/ 目录
禁止修改：web/、docs/（除非我明确说契约变更）

任务：<你的具体需求，例如：优化淘宝 L1 提取价格字段>

必读：
- docs/COLLECT_SCHEMA.md（输出 NormalizedProduct v1.0.0）
- docs/EXTENSION_SPEC.md
- extension/content/shared/extract-product.js

交付：说明改了哪些文件；附一条样例 NormalizedProduct JSON。
```

### 只让智能体做 Web（B）

```text
【Scope-B · Web端 only】
仓库：E-comassit-plan
只允许修改：web/ 目录
禁止修改：extension/（除非我明确说契约变更）

任务：<例如：采集箱列表增加 SKU 列>

必读：
- docs/COLLECT_SCHEMA.md
- web/src/lib/collectTypes.ts
- web/src/lib/inboxStore.ts

交付：npm run lint && npm run build 通过；若涉及导入，说明如何测 demoImport。
```

### 只改数据契约（两人都要知悉）

```text
【Scope-Contract · 契约变更】
同步修改：
- docs/COLLECT_SCHEMA.md（bump schemaVersion）
- shared/schemas/normalized-product.schema.json
- extension/content/shared/normalize.js
- web/src/lib/collectTypes.ts
- docs/API_OUTLINE.md（若 API 字段变）

禁止：只改一端而不改另一端。
```

### 联调（先 A 后 B，或开两个对话）

```text
【联调 L0】Scope-A 提供一条 1688 的 NormalizedProduct JSON；
【联调 L0】Scope-B 用该 JSON 测 web 采集箱导入，不改 extension。
```

---

## 3. 在 Cursor 里可加的 Rule（可选）

在项目 `.cursor/rules/` 或用户规则里写两条：

**规则 A（插件对话启用）**

```text
当前会话仅 Scope-A：只能编辑 extension/。采集输出必须符合 docs/COLLECT_SCHEMA.md。不要改 web/。
```

**规则 B（Web 对话启用）**

```text
当前会话仅 Scope-B：只能编辑 web/。读取采集数据用 collectTypes.NormalizedProduct。不要改 extension/。
```

建议：**开两个 Chat/Agent 窗口**，一个贴规则 A，一个贴规则 B，不要同一个对话里混做两端。

---

## 4. GitHub / Issue 标题

```text
[ext] Scope-A: 淘宝 SKU 提取
[web] Scope-B: collect-jobs mock
[schema] Scope-Contract: 新增 vendorId
```

---

## 5. 快速对照

| 你想说 | 应该说 |
|--------|--------|
| 改 Chrome 插件 | **Scope-A** / `extension/` |
| 改后台网页 | **Scope-B** / `web/` |
| 改两边都能用的 JSON 格式 | **Scope-Contract** |
| 改采集逻辑（页面里抓数据） | Scope-A |
| 改采集箱显示（抓完之后展示） | Scope-B |
| 改上传接口 | 先 Scope-Contract 定 API，再 A 发请求 + B 接接口 |

---

## 6. 相关文档

- `docs/TASK_ASSIGNMENT.md` — A1–B8 任务清单
- `docs/DEV_SPLIT.md` — 分支与 PR
- `AGENTS.md` — 仓库 Agent 入口
