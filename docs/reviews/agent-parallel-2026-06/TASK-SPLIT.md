# 任务分派：实施 vs 评审 双 Agent 模式

**开始时间**: 2026-06-02
**模式**: 后台实施 + 前台评审（伪并行）

---

## Track-1（实施 Agent - 后台）

**目标**: 完成 C 轨道剩余功能
- [ ] web/src/lib/title-optimizer/competitor-fetcher.ts
- [ ] web/src/lib/title-optimizer/batch-optimizer.ts
- [ ] 单元测试
- [ ] 类型检查

**输出**: 代码文件 + 测试通过证明

## Track-2（评审 Agent - 前台）

**目标**: 严格审查 B 轨道
- [ ] 对照 SPEC-B 26 个验收点
- [ ] 寻找实现漏洞
- [ ] 检查设计保留
- [ ] 输出审查报告 docs/reviews/agent-parallel-2026-06/REVIEW-B-V31.md

**输出**: 独立审查报告

---

## 同步点

两个 Track 都完成后:
1. 合并到主分支
2. 综合审查报告
3. 推送 GitHub
