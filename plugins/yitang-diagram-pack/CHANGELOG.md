# Changelog

本文件遵循 [Semantic Versioning](https://semver.org/)。

## [1.0.0] - 2026-06-04

### ✨ 新增
- 核心 skill：`diagram-generator`（Mermaid 思考 + drawio 交付）
- 复用 skill：`image-understanding`（MiniMax VLM 图片理解）
- 6 个斜杠命令：`/draw-dataflow` `/draw-architecture` `/draw-sequence` `/draw-er` `/draw-state` `/draw-flow`
- 9 类图模板：数据流图、C4 架构图、时序图、ER 图、状态机、流程图、部署图、类图、用户旅程
- 转换规则手册：`references.md`（Mermaid→drawio 完整映射表）
- 辅助脚本：
  - `scripts/styles.py` — 统一样式常量（与项目 build_deep_v100.py 风格一致）
  - `scripts/drawio_validate.py` — XML 校验 + 引用完整性 + 孤岛检测
  - `scripts/mermaid_to_svg.py` — Mermaid → SVG（README 预览用）
- 端到端示例：`examples.md`（DFD 流程 / 升级现有图 / 回灌迭代 3 个案例）
- Plugin 元数据：`plugin.json` + `marketplace.json`
- 文档：README、CHANGELOG、LICENSE、.gitignore

### 🎯 设计原则
- **Mermaid 是过程，drawio 才是产物**
- 不删减历史节点/边（与项目 `.claude/design-preservation.md` 铁律一致）
- 不覆盖历史版本（V1.0.0 → V1.0.1 → V1.0.2 ...）
- 支持用户在 app.diagrams.net 手动编辑后回灌 Claude
