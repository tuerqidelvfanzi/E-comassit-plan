# V3.0 开发管道

## 核心流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    V3.0 开发管道                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│   │  需求   │───▶│  调研   │───▶│  SPEC   │───▶│  实现   │    │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘    │
│        ▲                                                  │    │
│        │         ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│        └─────────│  验收   │◀───│  测试   │◀───│  自测   │    │
│                  └─────────┘    └─────────┘    └─────────┘    │
│                       │                                  │    │
│                       │         循环直到验收条件达到        │    │
└───────────────────────────────────────────────────────────────┘
```

## 阶段详解

### Phase 1: 需求 (Requirements)
- 收集用户需求
- 分析业务场景
- 定义功能范围
- 输出: `docs/requirements/*.md`

### Phase 2: 调研 (Research)
- 技术选型调研
- 竞品分析
- 第三方工具对比
- 输出: `docs/research/*.md`

### Phase 3: SPEC (Specification)
- 功能详细规格
- 接口定义
- 数据模型
- 验收标准
- 输出: `docs/SPEC.md`, `docs/theme-system/SPEC.md`

### Phase 4: 实现 (Implementation)
- 按 SPEC 实现代码
- 遵循设计规格保留原则
- 输出: `src/**`

### Phase 5: 自测 (Self-Test)
- 功能测试
- 类型检查 (`npx tsc --noEmit`)
- 构建测试 (`npm run build`)
- 输出: 测试报告

### Phase 6: 验收 (Acceptance)
- 对照 SPEC 逐项检查
- 用户体验验证
- 性能检查
- 文档更新

## 循环机制

```
while (验收条件未达到) {
    调用 superpower，直到完成工作
    执行测试
    if (测试通过) {
        进入验收阶段
    } else {
        修复问题
        重新自测
    }
}
```

## 调用 Superpower 的时机

| 时机 | Superpower 任务 |
|------|-----------------|
| 需求不明确 | 调用调研能力，生成完整需求文档 |
| 技术选型困难 | 调用代码能力，提供技术方案 |
| 遇到 bug | 调用 debug 能力，分析问题根因 |
| 代码质量差 | 调用重构能力，优化代码结构 |
| 测试覆盖率低 | 调用测试能力，补充测试用例 |

## 验收条件清单

- [ ] TypeScript 编译无错误
- [ ] 功能符合 SPEC 定义
- [ ] UI 符合设计规格
- [ ] 无严重性能问题
- [ ] 文档已更新
- [ ] Git 提交已推送

## 快速命令

```bash
# 类型检查
npx tsc --noEmit

# 构建
npm run build

# 测试
npm test

# lint
npm run lint
```

## 示例：完成一个功能

```
1. 需求: 用户需要看板视图
   → 创建 docs/requirements/kanban-view.md

2. 调研: 对比 @hello-pangea/dnd vs dnd-kit
   → 创建 docs/research/kanban-libraries.md

3. SPEC: 定义看板组件接口
   → 更新 docs/SPEC.md

4. 实现: 
   → npm install @hello-pangea/dnd
   → 创建 src/components/KanbanBoard.tsx

5. 自测:
   → npx tsc --noEmit ✓
   → npm run build ✓

6. 验收:
   → 浏览器测试 ✓
   → 对照 SPEC 检查 ✓
```
