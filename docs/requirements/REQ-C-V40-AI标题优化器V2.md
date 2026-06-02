# REQ-C: V4.0 AI 标题优化器 V2

> **轨道**: C | **目标**: 多语言 + A/B 测试 + SEO 评分
> **创建日期**: 2026-06-02 | **状态**: 📋 需求阶段

---

## 1. 背景

V1 标题优化器（`TITLE_OPTIMIZATION_REQUIREMENTS.md`）已实现基础功能：
- 关键词提取
- 标题模板生成
- 单语言（中文）

但跨境电商需要：
- 多语言支持（英/日/韩/西/法）
- 平台差异化（亚马逊/eBay/Shopee 算法差异）
- A/B 测试推荐
- SEO 评分

## 2. 目标

打造跨境电商标题优化的"瑞士军刀"。

## 3. 功能需求

### F-C1: 多语言支持
| 编号 | 描述 | 验收 |
|------|------|------|
| F-C1.1 | 支持 5 语言（zh/en/ja/ko/es） | 5 语言切换 |
| F-C1.2 | 语言自动检测 | 准确率 > 95% |
| F-C1.3 | 翻译 API 集成 | 至少 1 家供应商 |
| F-C1.4 | 语言特定字符限制 | 各平台规则 |

### F-C2: 平台适配
| 编号 | 描述 | 验收 |
|------|------|------|
| F-C2.1 | 亚马逊规则（200 字符、品牌前缀） | 规则库 |
| F-C2.2 | eBay 规则（80 字符、无 ALL CAPS） | 规则库 |
| F-C2.3 | Shopee 规则（100 字符、本地化） | 规则库 |
| F-C2.4 | Tiktok Shop 规则 | 规则库 |
| F-C2.5 | 用户选择平台 | UI 切换 |

### F-C3: SEO 评分
| 编号 | 描述 | 验收 |
|------|------|------|
| F-C3.1 | 关键词密度评分 | 0-100 分 |
| F-C3.2 | 长度合理性评分 | 0-100 分 |
| F-C3.3 | 字符多样性评分 | 0-100 分 |
| F-C3.4 | 总分 + 详细建议 | UI 展示 |

### F-C4: A/B 测试推荐
| 编号 | 描述 | 验收 |
|------|------|------|
| F-C4.1 | 生成 3-5 个候选标题 | 多样性保证 |
| F-C4.2 | 标注差异点 | UI 高亮 |
| F-C4.3 | 推荐最佳 1 个 | AI 排序 |

### F-C5: 竞品对比
| 编号 | 描述 | 验收 |
|------|------|------|
| F-C5.1 | 输入竞品 URL 抓取标题 | 至少 1 平台 |
| F-C5.2 | 关键词 gap 分析 | JSON 输出 |
| F-C5.3 | 借鉴建议 | 自然语言 |

### F-C6: 批量优化
| 编号 | 描述 | 验收 |
|------|------|------|
| F-C6.1 | CSV 上传（最多 100 条） | 表格预览 |
| F-C6.2 | 进度条 + 失败重试 | UI 反馈 |
| F-C6.3 | CSV 下载结果 | 导出文件 |

## 4. 数据模型

```typescript
interface TitleOptimizeRequest {
  productName: string;
  platform: 'amazon' | 'ebay' | 'shopee' | 'tiktok';
  language: 'zh' | 'en' | 'ja' | 'ko' | 'es';
  keywords: string[];
  brand?: string;
  category?: string;
  competitors?: string[]; // URLs
}

interface TitleOptimizeResponse {
  candidates: Array<{
    title: string;
    score: number;
    scores: {
      density: number;
      length: number;
      diversity: number;
    };
    highlights: string[];
  }>;
  recommended: number; // 索引
  reasoning: string;
}
```

## 5. UI/UX 要求

- 5 步向导：输入 → 选择平台/语言 → 生成 → 评分 → 导出
- 移动端可用（响应式）
- 实时评分（输入时即时反馈）

## 6. 验收清单

```markdown
- [ ] F-C1: 多语言（4 项）
- [ ] F-C2: 平台适配（5 项）
- [ ] F-C3: SEO 评分（4 项）
- [ ] F-C4: A/B 测试（3 项）
- [ ] F-C5: 竞品对比（3 项）
- [ ] F-C6: 批量优化（3 项）
- [ ] pre-commit 5 项检查通过
- [ ] 独立 Agent 审查通过
- [ ] 推送 GitHub
```

## 7. 风险

| 风险 | 缓解 |
|------|------|
| 翻译 API 成本 | 缓存 + 限流 |
| 评分算法主观 | 收集用户反馈校准 |
| 竞品抓取被封 | 限频 + 代理池 |
| 批量处理慢 | 队列 + 并发控制 |
