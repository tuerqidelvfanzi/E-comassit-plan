# 电商助手项目 — Agent 入口

## 目录约定

| 路径 | 用途 |
|------|------|
| `frontend-stack-reference-pack/` | **只读参考**：技术栈、架构、Vite 模板、Git/Skills，不直接改业务 |
| `docs/` | 规划与架构；**v2 需求** 以 `REQUIREMENTS_V2.md` 为准；重基线见 `REQUIREMENTS_V2_0.md`、`BUSINESS_FLOW_V2_0.md` |
| `api/` | 生产 REST API（Hono + SQLite，`/api/v1/*`） |
| `web/` | B 站 Web 应用（React + Vite + React Query） |
| `extension/` | 浏览器插件（Manifest V3） |
| `shared/pipeline/` | 处理管线共享逻辑（Web/API 测试） |

## 开发原则

1. 先读 `docs/REQUIREMENTS_V2.md`（v2 定稿需求）、`docs/REQUIREMENTS_V2_0.md`（重基线）、`docs/SOURCES_V2_0.md` 与 `docs/ARCHITECTURE.md` 再改代码。
2. **插件与 Web 采集数据**以 `docs/COLLECT_SCHEMA.md` 为唯一契约；改字段须同步插件、`web/src/lib/collectTypes.ts` 与 `shared/schemas/normalized-product.schema.json`。
3. 双人协作：`docs/TASK_ASSIGNMENT.md`（A 插件 / B Web）、`docs/DEV_SPLIT.md`；关联代码搜索 `COLLECT_SCHEMA` 或 `@coupling`。
4. **多智能体指代**：**Scope-A**（`extension/`）与 **Scope-B**（`web/`）— 功能全集见 `docs/SCOPE_FEATURES.md`；提示词见 `docs/AGENT_SCOPE.md`。
2. Web 工程遵循 `frontend-stack-reference-pack/agent-execution.md`：View 编排、Panel 承载业务、React Query 管服务端数据。
3. 业务与参考包解耦：不复制参考包中的业务模块名/API。
4. 前端验收须浏览器实开页面，不能仅凭 `vite` 终端输出。

## 参考原型

- 线上 UI 参考：https://psa-b6i.pages.dev/（商品选品助手）
- 会议结论白板：见 `docs/PROJECT_PLAN.md` 附录

## 架构图（drawio）生成规范

> 适用范围：`docs/architecture-diagrams/` 下所有 `.drawio` 文件及其生成脚本。

### 铁律：XML 属性必须转义

drawio 使用**严格 XML 解析器**。在 `value="..."` / `label="..."` 属性里出现的 `<`、`>`、`&`、`"` 必须用 XML entity 替换，否则打开报错：

```
非绘图文件 (error on line N at column M: Unescaped '<' not allowed in attributes values)
```

### 转义表

| 原文 | XML 实体 | 备注 |
|------|---------|------|
| `<` | `&lt;` | 任何裸小于号都必须转 |
| `>` | `&gt;` | 裸大于号建议一并转（与 `<` 成对） |
| `&` | `&amp;` | 仅当不是已有 entity 时 |
| `"` | `&quot;` | 仅在属性内出现时 |
| `'` | `&apos;` | 极少用 |

### 实现模板（Python 生成器必加）

```python
def xml_attr(s: str) -> str:
    """value/label 属性专用：转义 XML 特殊字符"""
    return (s.replace('&', '&amp;')
             .replace('<', '&lt;')
             .replace('>', '&gt;')
             .replace('"', '&quot;'))

def box(x, y, w, h, label, fill, stroke):
    # 注意：label 经 xml_attr 转义后再写入 value
    return f'<mxCell ... value="{xml_attr(label)}" ... />'
```

### 反例（踩过的坑）

| 错误写法 | 文件中的现象 | drawio 报错 |
|----------|------------|-----------|
| `httpClient <-> localAdapter` | 裸 `<->` | `Unescaped '<' not allowed` |
| `maxItems<=20` | 裸 `<=` | 同上 |
| `<Outlet />` | 裸标签符 | 同上 |
| `< 1s`（SLA 文案） | 裸 `<` | 同上 |
| `a & b` | 裸 `&` | `Entity '...' not defined` |

### 验证流程（生成后必跑）

1. **XML 良构检查**（任选其一）：
   ```bash
   python -c "import xml.etree.ElementTree as ET; ET.parse('xxx.drawio'); print('OK')"
   ```
2. **drawio 打开**（肉眼验）：用 drawio.net 桌面版/网页版/VSCode 插件打开，确认无 "非绘图文件" 弹窗
3. **节点计数**：脚本里加 `assert len(diagrams) == 期望页数`

### 目录与脚本约定

- 所有架构图统一放 `docs/architecture-diagrams/`
- 生成脚本（如 `build_drawio.py`）建议放项目根，**import 各页函数后拼装**
- 分页生成（`p_a.py` ~ `p_d.py`）便于单页迭代：修 P3 不影响 P1/P2
- 每次重生成前先 `rm` 旧 `.drawio`，避免遗留非法字符污染新文件

### 文件命名与版本号（强约束）

> 规则源：`~/.claude/skills/doc-production-workflow-quickwrite/SKILL.md` §版本管理规则
> 适用范围：`docs/architecture-diagrams/` 下所有 `.drawio`、`.svg`、`.md` 文档

**文件名格式**：`[文件名V{A}.{X}.{Y}]`（中文文件名优先，便于阅读查找）

| 级别 | 触发条件 | 示例 |
|------|---------|------|
| **A** 大版本 | 新资料类型 / 新思路 / 新章节 / 边界变化 | V2.0.0 |
| **X** 中版本 | 结构或内容小范围重构（章节调整、模块重排、流程改写） | V1.1.0 |
| **Y** 小版本 | 仅文字润色、描述修正、措辞优化，结构不变 | V1.0.1 |

**强制规则**：
- 文件名必须包含版本号（`V{A}.{X}.{Y}`）
- **绝不修改原始文件**，每次修改生成新版本文件
- 保留所有历史版本（基线可回滚）
- 每次发布必须有变更记录（放 `CHANGELOG-<文档名>.md`）

**禁止命名**：
- ❌ `xxx最终版.docx` / `xxx最新` / `xxx修改版`（版本不明确）
- ❌ `xxx-v1` / `xxx-v2`（格式不完整）
- ❌ `xxx.drawio` 无版本号后缀

**架构图专项**：
- 当前：`电商助手架构图V1.0.0.drawio`（8 页 471 节点 194 边）
- 历史：`电商助手架构图V0.1.0.drawio`（保留作基线）
- 变更日志：`docs/architecture-diagrams/CHANGELOG-电商助手架构图.md`

### 节点文案约束（阅读复杂度）

> 用户要求：每节点描述 ≤2 句，每页整体阅读时间 ≤8 分钟

- 普通节点 `value` 字段 ≤2 行（多行细节放每页底部 `nt*` "本页阅读说明"）
- 节点不超过 2 句话（中文 30 字以内）
- 详细解释集中在底部面板，不重复在节点上

