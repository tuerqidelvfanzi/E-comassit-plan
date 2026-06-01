# 电商AI助手 - 产品需求规格书 v3.0

版本: v3.0.0
日期: 2026-05-31
状态: 草案（基于市场调研）
调研来源: GitHub项目分析 + App Store应用分析



## 0. 文档说明

### 0.1 目的

本文是 v3.0 功能需求规格，基于以下调研：
- GitHub 245+ Stars 的采集项目（1688/淘宝/拼多多）
- GitHub 326 Stars 的AI描述生成项目
- GitHub 200+ Stars 的竞品分析项目
- App Store 4.7分 AI上品工具用户反馈
- 东南亚市场独特需求（越南20字/五段SKU/违禁词）

### 0.2 调研证据索引

| 调研发现 | 证据来源 |
|----------|----------|
| 采集需求强烈 | GitHub: 1688-scraper (213★), taobao scraper (27★), pinduoduo scraper (5★) |
| AI描述生成需求最强 | GitHub: description-generator (326★) - Stars最高项目 |
| AI标题生成需求高 | GitHub: Amazon-Skills (200★), product-info-ai-generator (15★) |
| 用户不愿手动写标题 | App Store: SellRaze (4.7★) |
| 用户想要一键上品 | App Store: eProfit (4.7★) |
| 跨平台发布是基础 | App Store: Crosslist/Vendoo |
| 现有ERP无AI | 店小秘/店八方 |
| 东南亚独特需求 | 越南20字/五段SKU/违禁词 |


### 0.3 术语定义

| 术语 | 调研依据 | 定义 |
|------|----------|------|
| 采集层 | GitHub 245+ Stars | 从源平台抓取商品数据 |
| 改写层 | GitHub 326+ Stars | AI优化标题/描述/SKU/图片 |
| 发布层 | App Store用户反馈 | 填表或API写入目标平台 |
| 五段SKU | 调研新发现 | {PREFIX}-{SEQ}-{SIDE}-{COLOR}-{SIZE} |
| 白色钩子 | 调研新发现 | 单色款式占位SKU，价格400/库存5 |
| Type×Platform | 调研新发现 | 类目模板×目标平台 二维矩阵 |

---

## 1. 产品定位（基于调研修正）

### 1.1 调研修正

| v2.0理解 | 调研修正 | 依据 |
|----------|----------|------|
| 竞品分析在采集之后 | 竞品分析在采集之前 | App Store: Listed AI |
| 改写层仅标题 | 改写层包含标题+描述+SKU+图片+属性 | GitHub 326+ Stars |
| 模板单一维度 | 模板Type×Platform多维度 | App Store |
| 规则库简单 | 规则库需多维度 | App Store |

### 1.2 v3.0产品定位

一句话：跨境运营的智能上品中枢（采集→AI改写→跨平台发布）

核心价值主张（基于调研）：
- 用户不想手动写标题 → AI自动生成优化标题
- 用户想要一键上品 → 采集到发布完整闭环
- 现有方案无AI → 东南亚首个AI上品工具
- 各国规则不同 → Type×Platform模板多维度

### 1.3 目标用户

| 用户类型 | 调研依据 | 核心需求 |
|----------|----------|----------|
| 多平台铺货卖家 | Crosslist/Vendoo用户 | 快速上品、多平台发布 |
| AI工具爱好者 | SellRaze/eProfit用户(4.7★) | AI自动化、省时 |
| 精品运营卖家 | Amazon-Skills用户 | 竞品分析、精细化运营 |
| 工厂型卖家 | 1688-scraper用户 | 批量采集、多SKU管理 |


---

## 2. 功能架构（基于调研）

### 2.1 四层架构

- 配置层（新增）- 模板管理 | 规则库 | 违禁词库 | 翻译词库
- 选品决策层（新增）- 竞品分析 | 选品看板 | 上品清单 | 采集任务
- 采集层（P0）- 插件采集 | 链接直采 | 采集箱
- 改写层（核心P0）- 标题改写 | 描述改写 | 图片改写 | SKU改写 | 属性改写 | 违禁检测 | 规则校验
- 发布层（P0）- 预览确认 | 插件填表 | API发布

### 2.2 功能优先级矩阵

| 功能 | GitHub Stars | App评分 | 优先级 |
|------|-------------|---------|--------|
| 多源采集 | 245★ | - | P0 |
| AI描述生成 | 326★ | 4.7★ | P0 |
| AI标题生成 | 200+★ | 4.7★ | P0 |
| 东南亚发布 | - | 4.6★ | P0 |
| 违禁词检测 | - | - | P0 |
| 竞品分析 | 200★ | - | P1 |
| SKU五段编码 | - | - | P1 |
| 越南20字控制 | - | - | P1 |
| 图片处理 | 1★ | - | P1 |
| 模板多维度 | - | - | P1 |
| 规则库多维度 | - | - | P1 |
| 描述改写 | 326★ | 4.7★ | P1 |
| 属性映射 | - | - | P2 |
| 多站同时发布 | - | 4.6★ | P2 |


---

## 3. 采集层需求（FR-C）

### 3.1 采集平台覆盖

| 源平台 | GitHub证据 | 优先级 |
|--------|-----------|--------|
| 1688 | 1688-scraper (213★) | P0 |
| 淘宝/天猫 | taobao scraper (27★) | P0 |
| 拼多多 | pinduoduo-scraper (5★) | P1 |
| 抖音 | - | P2 |
| 京东 | taobao-scraper (27★) | P1 |

### 3.2 采集方式

#### FR-C-01 插件采集（P0）

| 项目 | 需求 | 调研依据 |
|------|------|----------|
| 技术方案 | Chrome Extension MV3 + content script | 主流方案 |
| 采集触发 | 悬浮按钮 + 快捷键 | 用户体验 |
| 数据提取 | JSON-LD → DOM解析兜底 | 技术可行性 |
| 防封策略 | 随机延迟250-2400ms | 行业标准 |
| 输出格式 | NormalizedProduct | 标准化需求 |

#### FR-C-02 链接直采（P1）

| 项目 | 需求 | 调研依据 |
|------|------|----------|
| 技术方案 | Worker + Playwright | 后端渲染复杂页面 |
| 用户操作 | 粘贴URL → 后台处理 | ecom-agent模式 |
| 失败处理 | 重试3次 + 错误提示 | 用户体验 |

#### FR-C-03 采集箱（P0）

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| 列表展示 | 分页/筛选/排序 | 基础需求 |
| 批量操作 | 删除/标记/导出 | Crosslist用户习惯 |
| 来源标记 | 1688/淘宝/拼多多/抖音 | 采集源追踪 |

### 3.3 采集验收标准

- [ ] 从1688/淘宝各采集1条，数据字段完整
- [ ] 采集箱支持筛选来源/时间/状态
- [ ] 采集失败显示错误原因


---

## 4. 选品决策层需求（FR-S）

### 4.1 竞品分析

#### FR-S-01 竞品分析任务（P1）

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| 分析维度 | 标题词频/价格区间/款式趋势/销量估算 | Amazon-Skills |
| 数据来源 | 源平台搜索结果/榜单页面 | 调研新发现 |
| 分词处理 | 中文(jieba)/泰语(thaiseg)/越南语(vietseg) | 技术可行性 |
| 输出格式 | 竞品分析报告（持久化） | Listed AI模式 |
| 报告内容 | 高频词/价格带/热门款式/样例标题 | Amazon-Skills |

#### FR-S-02 选品看板（P1）

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| 数据展示 | GMV/CTR/价格分布/款式分布 | Amazon-Skills |
| 筛选过滤 | 按类目/价格/销量筛选 | 基础功能 |
| 一键采集 | 从分析结果直接加入采集箱 | Listed AI模式 |
| 报告引用 | 关联分析报告ID到工作台 | 闭环需求 |

#### FR-S-03 上品计划（P2）

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| 计划创建 | 确定品类/目标平台/SKU数量 | 调研新发现 |
| 执行追踪 | 计划vs实际对比 | 用户管理需求 |
| 采集任务 | 按计划自动执行采集 | 自动化需求 |

### 4.2 选品验收标准

- [ ] 输入关键词，输出竞品分析报告
- [ ] 报告包含标题高频词/价格区间/款式趋势
- [ ] 可从分析结果一键加入采集箱
- [ ] 工作台可引用竞品报告


---

## 5. 改写层需求（FR-RW）

### 5.1 改写前置确定

| 确定项 | 选项 | 调研依据 |
|--------|------|----------|
| 目标平台 | 越南Shopee / 泰国TikTok / 菲律宾Shopee / 印尼Shopee | 东南亚市场 |
| 类目模板 | 男装/女装/童装/灯具/橱柜/美妆 × 目标平台 | Type×Platform |
| 竞品报告 | 可选引用分析报告作为上下文 | Listed AI模式 |

### 5.2 标题改写（FR-RW-01）

#### 功能需求

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| 关键词提取 | 从原始标题提取品类/材质/颜色/人群词 | Amazon-Skills |
| 语义压缩 | 中文标题压缩到9-10字 | 越南20字限制 |
| 本地化翻译 | 中→越/中→泰/中→菲/中→英 | 多语言需求 |
| 字符截断 | 越南≤20/泰国≤220/菲律宾≤120/印尼≤120 | 平台规则 |
| emoji策略 | 越南禁用/泰国可用/菲律宾可用 | 调研新发现 |
| 品牌处理 | 删除或替换品牌词 | 违禁词需求 |

#### 越南标题示例

原始：2024夏季新款可爱卡通小熊图案印花纯棉短袖T恤儿童百搭休闲上衣

处理步骤：
1. 关键词提取：T恤、儿童、纯棉、卡通、印花、夏季
2. 语义压缩：卡通小熊纯棉T恤（10字）
3. 越南翻译：Ao thun cotton gau truc de thuong
4. 字符截断：Ao thun cotton gau（16字符）

输出：Ao thun cotton gau truc de thuong（越南语）

#### 技术实现

| 技术点 | 方案 | 调研依据 |
|--------|------|----------|
| 语义压缩 | LLM + Few-shot Prompt | Amazon-Skills |
| 翻译 | DeepL/Google/阿里翻译 | 行业标准 |
| 字符计数 | Unicode码点精确计数 | 越南严格限制 |

### 5.3 描述改写（FR-RW-02）

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| 越南短描述 | ≤20字越南语独立字段 | 越南Shopee要求 |
| 详情描述本地化 | 中→越/中→泰/中→菲翻译 | 多语言需求 |
| 规格参数整理 | 格式化为目标平台要求 | Listed AI |
| 售后话术 | 各国合规售后文案 | 调研新发现 |

### 5.4 SKU改写（FR-RW-03）

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| SKU矩阵生成 | 颜色×尺码笛卡尔积 | 服装类需求 |
| 五段编码 | {PREFIX}-{SEQ:4}-{SIDE}-{COLOR}-{SIZE} | 越南标准 |
| 白色钩子 | 单色款式占位SKU | 越南特有 |
| 印花后缀 | +B(白底黑花)/+H(黑底白花) | 调研新发现 |

#### SKU编码规格

格式：{PREFIX}-{SEQUENCE:4}-{SIDE}-{COLOR}-{SIZE}
示例：BF-0001-PR-WH-S

字段说明：
- PREFIX: 店铺前缀（模板配置）
- SEQUENCE: 0001-9998递增
- SIDE: P(正面)/R(反面)/PR(正反面)
- COLOR: WH/BK/RD/BL/GR/YL/PK/PU/OR/GY
- SIZE: S/M/L/XL/XXL/XXXL

白色钩子：
- 触发：单款式商品
- SKU：{PREFIX}-9999-P-WH-{SIZE}
- 价格：400（固定）
- 库存：5（固定）
- 重量：220g（固定）

印花后缀：BF-0001-PR-WH-S+B (白底黑花) / BF-0001-PR-WH-S-H (黑底白花)


### 5.5 图片改写（FR-RW-04）

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| 数量验证 | 越南9张/泰国≥5张/菲律宾9张 | 平台规则 |
| 尺寸调整 | 1:1 (800×800) | Listed AI |
| 消除笔 | 去除水印/LOGO/价格/文案 | watermark-eraser |
| 中文翻译覆盖 | 图片文字翻译为本地语言 | Listed AI |
| 主图白底 | 越南第一张必须白底 | 调研新发现 |
| 详情图顺序 | 泰国固定4槽顺序 | 调研新发现 |

#### 消除内容

| 类型 | 示例 | 调研依据 |
|------|------|----------|
| 质保/退货文案 | 终身质保、免费退货 | 越南平台规则 |
| 包邮标识 | 全国包邮、免运费 | 国内标识 |
| LOGO/水印 | 1688水印、厂家LOGO | watermark-eraser |
| 价格标签 | 价签、二维码 | 平台规则 |
| 其他平台标识 | 淘宝/天猫标记 | 越南规则 |

### 5.6 属性改写（FR-RW-05）

| 功能 | 需求 | 调研依据 |
|------|------|----------|
| 属性映射 | 源属性→目标平台属性 | 调研新发现 |
| 属性值标准化 | 颜色/尺码名称标准化 | 调研新发现 |
| 计量单位转换 | cm→inch/kg→lb等 | 调研新发现 |
| 认证标识添加 | 按目标市场添加认证 | 调研新发现 |

### 5.7 违禁词检测（FR-RW-06）

#### 检测类型

| 类型 | 内容 | 调研依据 |
|------|------|----------|
| 品牌词 | Nike/Adidas/Disney/LV/Gucci/Chanel/爱马仕/苹果/三星/华为/NASA | 东南亚规则 |
| 国内标识 | 3C认证/发货地/包邮/Made in China/全网最低 | 越南平台规则 |
| 虚假宣传 | 最高级/绝对化/医疗用语 | 调研整理 |
| 面料一致性 | 标题含棉→属性必须含棉 | 调研新发现 |
| 宗教禁忌 | 印尼清真/其他宗教敏感词 | 调研新发现 |

#### 检测位置

| 位置 | 检测内容 | 调研依据 |
|------|----------|----------|
| 标题 | 品牌词/国内标识/虚假宣传 | 越南平台规则 |
| 描述 | 品牌词/国内标识/虚假宣传 | 越南平台规则 |
| 属性 | 面料一致性 | 调研新发现 |
| 图片 | 品牌LOGO/水印/国内标识 | watermark-eraser |

#### 处理策略

| 策略 | 行为 | 调研依据 |
|------|------|----------|
| 阻断 | 发现违禁词→阻止发布 | 安全需求 |
| 警告 | 提示用户但不阻止 | 用户体验 |
| 自动替换 | 品牌词→[品牌]占位 | 简化操作 |

### 5.8 改写验收标准

- [ ] 越南标题≤20字符，越南语
- [ ] 泰国标题≤220字符，泰语
- [ ] 五段SKU编码正确
- [ ] 白色钩子生成正确
- [ ] 品牌词/国内标识检测生效
- [ ] 面料一致性检测生效
- [ ] 图片消除笔处理后无水印LOGO
- [ ] AI生成描述符合平台格式


---

## 6. 发布层需求（FR-P）

### 6.1 发布目标平台

| 平台 | 调研依据 | 优先级 |
|------|----------|--------|
| 越南Shopee | 核心市场 | P0 |
| 泰国TikTok Shop | 核心市场 | P1 |
| 菲律宾Shopee | 核心市场 | P1 |
| 印尼Shopee | 调研新发现 | P2 |

### 6.2 发布方式

#### FR-P-01 插件填表（P0）

| 项目 | 需求 | 调研依据 |
|------|------|----------|
| 技术方案 | content script + Playwright | 主流方案 |
| 填写内容 | 标题/价格/SKU/图片/属性 | Crosslist |
| 填写方式 | DOM定位 + 表单填充 | 调研整理 |
| 验证机制 | 截图+文本确认 | 用户安全 |
| 失败处理 | 重试3次 + 错误日志 | 用户体验 |

#### FR-P-02 Open API（P3）

| 项目 | 需求 | 调研依据 |
|------|------|----------|
| 技术方案 | Shopee/TikTok官方API | 稳定性需求 |
| 授权方式 | OAuth2.0 | 行业标准 |
| 适配器模式 | PublishingAdapter抽象 | 技术架构 |

#### FR-P-03 多站同时发布（P2）

| 项目 | 需求 | 调研依据 |
|------|------|----------|
| 触发方式 | 一次选择多平台 | Crosslist |
| 执行方式 | 并行/串行可选 | 用户控制 |
| 状态追踪 | 各站独立状态 | 调研新发现 |

### 6.3 发布状态机

draft → pending → filling → completed | failed

| 状态 | 含义 | 用户操作 |
|------|------|----------|
| draft | 草稿，可编辑 | 保存 |
| pending | 待执行 | 确认发布 |
| filling | 执行中 | 查看进度 |
| completed | 成功 | 查看结果 |
| failed | 失败 | 重试 |

### 6.4 发布验收标准

- [ ] 越南Shopee填表成功（非Mock）
- [ ] 发布状态完整追踪
- [ ] 失败可重试
- [ ] 多站发布状态独立

---

## 7. 配置层需求（FR-CFG）

### 7.1 模板系统（FR-CFG-01）

#### 模板多维度矩阵

| 类目 | 越南Shopee | 泰国TikTok | 菲律宾Shop | 印尼Shopee |
|------|-----------|------------|------------|------------|
| 男装(A) | 模板A-VN | 模板A-TH | 模板A-PH | 模板A-ID |
| 女装(A) | 模板W-VN | 模板W-TH | 模板W-PH | 模板W-ID |
| 童装(A) | 模板K-VN | 模板K-TH | 模板K-PH | 模板K-ID |
| 灯具(B) | 模板L-VN | 模板L-TH | 模板L-PH | 模板L-ID |
| 橱柜(C) | 模板C-VN | 模板C-TH | 模板C-PH | 模板C-ID |
| 美妆 | 模板M-VN | 模板M-TH | 模板M-PH | 模板M-ID |

#### 模板内容

| 内容 | 作用 | 调研依据 |
|------|------|----------|
| systemPrompt | AI提示词 | description-generator |
| skuConfig | SKU配置 | 五段编码 |
| sizeTable | 尺码表 | 男装/女装/童装差异 |
| colorCodes | 颜色编码 | WH/BK/RD... |
| imageRules | 图片规则 | 越南9张/泰国≥5张 |

### 7.2 规则库（FR-CFG-02）

#### 规则多维度

| 维度 | 示例 | 调研依据 |
|------|------|----------|
| 国家 | 越南/泰国/菲律宾/印尼 | 东南亚市场 |
| 平台 | Shopee/TikTok | Crosslist |
| 类目 | 服装/灯具/橱柜/美妆 | Type×Platform |
| 季节 | 常规/夏季/冬季/节日 | 调研新发现 |

#### 规则类型

| 类型 | 内容 | 调研依据 |
|------|------|----------|
| 价格规则 | 倍率/固定价/最低最高价 | eProfit定价 |
| 库存规则 | 默认库存/区间 | 调研整理 |
| 重量规则 | 默认重量 | 调研整理 |
| 标题规则 | 字数/格式/emoji | 越南20字/泰国220字 |
| 图片规则 | 数量/尺寸/保留类型 | 平台规则 |
| 违禁词规则 | 品牌/国内/虚假/宗教 | 东南亚特有 |
| 面料规则 | 棉质一致性 | 调研新发现 |
| 物流规则 | 包裹尺寸 | 调研新发现 |
| 认证规则 | 各国认证要求 | 调研新发现 |

### 7.3 违禁词库（FR-CFG-03）

| 分类 | 内容 | 调研依据 |
|------|------|----------|
| 品牌词 | Nike/Adidas/Disney/LV/Gucci/Chanel/爱马仕/苹果/三星/华为/NASA | 东南亚规则 |
| 国内标识 | 3C认证/发货地/包邮/最便宜/全网最低/100%正品 | 越南规则 |
| 虚假宣传 | 最高级/绝对化/医疗用语 | 调研整理 |
| 宗教禁忌 | 印尼清真/其他宗教敏感词 | 调研新发现 |
| 面料词 | 棉/涤纶/混纺关键词 | 面料一致性 |

### 7.4 翻译词库（FR-CFG-04）

| 类型 | 内容 | 调研依据 |
|------|------|----------|
| 行业术语 | 服装类/灯具类/橱柜类专有名词 | 多语言需求 |
| 常用表达 | 跨境常用表达 | 本地化需求 |
| 平台词 | Shopee/TikTok平台特定词 | 调研新发现 |

### 7.5 配置验收标准

- [ ] 模板支持Type×Platform二维配置
- [ ] 规则库支持国家/平台/类目/季节多维度
- [ ] 违禁词库可扩展
- [ ] 规则修改对新任务生效


---

## 8. 菜单目录（v3.0）

```
电商AI助手
├── 选品中心
│   ├── 竞品分析（新增）
│   ├── 选品看板（新增）
│   └── 上品计划（新增）
│
├── 采集中心
│   ├── 采集箱
│   ├── 采集任务
│   └── 链接直采
│
├── 工作台
│   ├── 我的商品
│   ├── 处理管线
│   └── 历史记录
│
├── 发布中心
│   ├── 发布队列
│   ├── 发布历史
│   └── 账号配置
│
├── 配置中心
│   ├── 类目模板（Type×Platform）
│   ├── 规则库（多维度）
│   ├── 违禁词库
│   └── 翻译词库
│
└── 系统设置
    ├── 账号管理
    ├── LLM配置
    └── 插件配对
```

---

## 9. 业务流程（v3.0）

1. 选品决策（调研新增）
   竞品分析 → 生成报告 → 确定品类 → 制定上品计划

2. 采集（GitHub 245★）
   候选商品 → 插件采集/链接直采 → 入采集箱

3. 改写（GitHub 326★ + App 4.7★）
   前置确定：目标平台 | 类目模板 | 竞品报告
   标题改写 | 描述改写 | 图片改写 | SKU改写 | 属性改写
   违禁检测 | 规则校验
   ProcessedProduct → 预览确认

4. 发布（App 4.6★）
   发布队列 → 插件填表 → 发布完成

---

## 10. 技术架构

### 10.1 组件架构

- 用户界面层（React 19）：选品中心 | 采集中心 | 工作台 | 发布中心 | 配置中心
- API层（Hono）：选品API | 采集API | 处理API | 发布API | 配置API
- 业务逻辑层（Shared）：SKU编码 | 价格计算 | 违禁检测 | 规则引擎 | 模板驱动
- Worker层（异步）：竞品分析 | LLM改写 | 图片处理 | 采集Worker | 填表Worker
- 数据层：SQLite | 规则库 | 模板库 | 违禁词库 | 图片存储
- 插件层（Extension MV3）：采集插件 | 填表插件 | Popup

### 10.2 数据契约

#### NormalizedProduct（采集输出）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一ID |
| source | enum | 1688/taobao/pinduoduo/jd/douyin |
| sourceUrl | string | 原始链接 |
| title | string | 原始标题 |
| description | string | 原始描述 |
| price | number | 原价CNY |
| images | string[] | 图片URL数组 |
| skus | RawSku[] | 原始SKU |
| attributes | KeyValue[] | 原始属性 |
| extractedAt | ISO8601 | 采集时间 |

#### ProcessedProduct（改写输出）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一ID |
| sourceProductId | string | 关联原始商品 |
| targetLocale | enum | vi-VN/th-TH/fil-PH/id-ID |
| templateId | string | 类目模板 |
| title | string | 优化后标题 |
| shortDescription | string | 越南短描述≤20字 |
| description | string | 本地化描述 |
| price | number | 目标币别价格 |
| skus | ProcessedSku[] | 含skuCode |
| images | ProcessedImage[] | 含处理状态 |
| warnings | string[] | 违禁/规则告警 |
| insightsRef | string? | 关联竞品报告 |
| processedAt | ISO8601 | 处理时间 |

#### CompetitorInsights（选品输出）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 报告ID |
| keywords | Keyword[] | 高频词频 |
| priceRange | {min, max, p25, p50, p75} | 价格分位 |
| popularColors | string[] | 热门颜色 |
| popularSizes | string[] | 热门尺码 |
| sampleTitles | string[] | 样例标题 |
| generatedAt | ISO8601 | 生成时间 |


---

## 11. 开发计划

### 11.1 里程碑

| 里程碑 | 主要交付 | 优先级 |
|--------|----------|--------|
| v3.0 MVP | 采集 + 改写(标题+SKU+违禁) + 发布(VN) | P0 |
| v3.1 | 竞品分析 + 选品看板 + 多站发布 | P1 |
| v3.2 | 图片处理 + 描述改写 + 模板多维度 | P1 |
| v3.3 | 规则库多维度 + 属性映射 + 印尼站 | P2 |

### 11.2 验收标准

#### v3.0 MVP

- [ ] 从1688/淘宝采集1条，采集箱展示
- [ ] 工作台选择越南+服装模板
- [ ] AI标题优化，越南语≤20字符
- [ ] 五段SKU自动生成，白色钩子正确
- [ ] 违禁词检测生效
- [ ] 越南Shopee填表成功
- [ ] 发布状态completed

---

## 12. 主题系统升级（FR-SYS-01）

### 12.1 升级背景

参考 [html-ppt theme-showcaseV2.html](file:///d/05-创作/智能体/.agents/skills/html-ppt/templates/theme-showcaseV2.html) 的36种主题，为用户提供丰富的主题选择。

### 12.2 主题分类与清单

#### 浅色系主题（15个）

| ID | 中文名 | 英文名 | 说明 | 字体 |
|----|--------|--------|------|------|
| minimal-white | 极简白 | Minimal White | clean restraint · 克制高级 | Inter + Noto Sans SC |
| editorial-serif | 杂志衬线 | Editorial Serif | high editorial · 高级杂志风 | Playfair Display + Noto Serif SC |
| soft-pastel | 马卡龙 | Soft Pastel | 柔和马卡龙 · 温柔粉嫩 | Inter + Noto Sans SC |
| corporate-clean | 企业商务 | Corporate Clean | 专业商务 · 蓝黑配色 | Inter |
| academic-paper | 学术白皮书 | Academic Paper | 学术论文 · 简洁严谨 | Inter + Noto Sans SC |
| swiss-grid | 瑞士网格 | Swiss Grid | Helvetica感 · 极简红黑 | Inter + Helvetica |
| xiaohongshu-white | 小红书白底 | XiaoHongShu | 小红书风格 · 高级感 | Noto Sans SC + Playfair Display |
| sharp-mono | 黑白高对比 | Sharp Mono | 黑白分明 · 锐利衬线 | Archivo Black |
| magazine-bold | 大字杂志 | Magazine Bold | 120px大字标题 · 冲击力 | Playfair Display + Noto Serif SC |
| engineering-whiteprint | 工程白图 | Engineering | 蓝图风格 · 工程图纸 | JetBrains Mono |
| news-broadcast | 新闻播报 | News Broadcast | 红白新闻风 · 大字标题 | Oswald |
| solarized-light | 阳光墨玉 | Solarized Light | 护眼暖黄 · 经典编程色 | Inter |
| catppuccin-latte | Catppuccin Latte | Catppuccin Latte | 咖啡拿铁 · 温暖浅色 | Inter |
| arctic-cool | 冷色调 | Arctic Cool | 蓝青冷色 · 冷静专业 | Inter |
| sunset-warm | 暖色调 | Sunset Warm | 橘珊瑚琥珀 · 温暖舒适 | Inter |
| memphis-pop | 孟菲斯波普 | Memphis Pop | 几何图案 · 活泼创意 | Space Grotesk + Archivo Black |
| bauhaus | 包豪斯几何 | Bauhaus | 红黄蓝原色 · 极简几何 | Space Grotesk + Archivo Black |
| midcentury | 世纪中期 | Mid-Century | 复古现代 · 棕绿配色 | Playfair Display |
| rainbow-gradient | 彩虹渐变 | Rainbow Gradient | 彩虹点缀 · 活力多彩 | Inter |

#### 深色系主题（10个）

| ID | 中文名 | 英文名 | 说明 | 字体 |
|----|--------|--------|------|------|
| dracula | 德古拉紫 | Dracula | 经典紫红 · 程序员最爱 | Inter |
| tokyo-night | 东京夜景 | Tokyo Night | 日式深蓝 · 赛博朋克前身 | Inter |
| nord | 北欧极简 | Nord | nordic cool · 冷淡高级 | Inter |
| catppuccin-mocha | Catppuccin Mocha | Catppuccin Mocha | 摩卡深色 · 温暖紫调 | Inter |
| gruvbox-dark | Gruvbox Dark | Gruvbox Dark | 复古暖色 · 高对比暗色 | Inter |
| rose-pine | 玫瑰松石 | Rose Pine | 粉紫配色 · 温柔暗色 | Inter |
| terminal-green | 绿屏终端 | Terminal Green | 经典绿屏 · 复古终端 | JetBrains Mono |
| glassmorphism | 毛玻璃 | Glassmorphism | 透明毛玻璃 · 梦幻质感 | Inter |
| aurora | 极光渐变 | Aurora | 北欧极光 · 流光溢彩 | Inter |
| pitch-deck-vc | VC融资风 | Pitch Deck VC | YC风融资 · 渐变蓝紫 | Inter |

#### 科技感主题（4个）

| ID | 中文名 | 英文名 | 说明 | 字体 |
|----|--------|--------|------|------|
| cyberpunk-neon | 赛博霓虹 | Cyberpunk Neon | 霓虹粉青 · 赛博朋克 | Inter + JetBrains Mono |
| blueprint | 蓝图工程 | Blueprint | 蓝色网格 · 工程图纸 | JetBrains Mono |
| y2k-chrome | Y2K镜面 | Y2K Chrome | 千禧银色 · 铬金属质感 | Space Grotesk |
| neo-brutalism | 新粗野主义 | Neo-Brutalism | 厚描边硬阴影 · 明黄点缀 | Space Grotesk + Archivo Black |

#### 复古风主题（3个）

| ID | 中文名 | 英文名 | 说明 | 字体 |
|----|--------|--------|------|------|
| vaporwave | 蒸汽波 | Vaporwave | 粉紫渐变 · 复古未来 | Space Grotesk |
| retro-tv | CRT扫描线 | Retro TV CRT | 复古显像管 · 暖黄扫描线 | Playfair Display |
| japanese-minimal | 和风极简 | Japanese Minimal | 朱红点缀 · 日式侘寂 | Noto Serif SC + Playfair Display |

### 12.3 CSS变量规范

每种主题需定义以下CSS变量：

```css
:root[data-theme='{theme-id}'] {
  /* 背景色 */
  --color-bg: #xxx;
  --color-bg-soft: #xxx;
  
  /* 表面色 */
  --color-surface: #xxx;
  --color-surface-2: #xxx;
  
  /* 边框色 */
  --color-border: rgba(xxx);
  --color-border-strong: rgba(xxx);
  
  /* 文字色 */
  --color-text: #xxx;
  --color-text-2: #xxx;
  --color-text-3: #xxx;
  
  /* 强调色 */
  --color-accent: #xxx;
  --color-accent-2: #xxx;
  --color-accent-3: #xxx;
  
  /* 状态色 */
  --color-success: #xxx;
  --color-warn: #xxx;
  --color-danger: #xxx;
  
  /* 渐变 */
  --gradient: linear-gradient(...);
  --gradient-soft: linear-gradient(...);
  
  /* 圆角 */
  --radius: 14px;
  --radius-sm: 10px;
  --radius-lg: 22px;
  
  /* 阴影 */
  --shadow: 0 10px 30px rgba(...);
  --shadow-lg: 0 22px 60px rgba(...);
  
  /* 字体 */
  --font-sans: 'Inter', 'Noto Sans SC', sans-serif;
  --font-display: 'JetBrains Mono', monospace;
  --font-serif: 'Playfair Display', 'Noto Serif SC', serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', monospace;
}
```

### 12.4 UI组件要求

| 组件 | 要求 |
|------|------|
| 主题选择器 | 网格布局，按分类分组（浅色/深色/科技/复古） |
| 主题预览 | 显示主题色块 + 字体示例 |
| 分类标签 | light/dark/tech/retro 四种分类标签 |
| 主题卡片 | 选中状态高亮，显示中英文名称 |
| 实时预览 | 选择后立即在全站生效 |
| 本地存储 | localStorage 保存用户选择 |
| 自定义CSS | 保留自定义CSS编辑器 |

### 12.5 功能ID

| ID | 功能 | 优先级 | 状态 |
|----|------|--------|------|
| FR-SYS-01-01 | 36种预设主题实现 | P0 | 待开发 |
| FR-SYS-01-02 | 主题分类分组展示 | P0 | 待开发 |
| FR-SYS-01-03 | 主题实时切换 | P0 | 待开发 |
| FR-SYS-01-04 | 自定义CSS编辑器 | P1 | 待开发 |
| FR-SYS-01-05 | 主题预览卡片 | P1 | 待开发 |

---

## 13. 功能ID汇总

| ID | 功能 | 优先级 | 调研依据 |
|----|------|--------|----------|
| FR-C-01 | 插件采集（1688/淘宝） | P0 | GitHub 245★ |
| FR-C-02 | 链接直采 | P1 | ecom-agent |
| FR-C-03 | 采集箱 | P0 | 基础需求 |
| FR-S-01 | 竞品分析任务 | P1 | GitHub 200★ |
| FR-S-02 | 选品看板 | P1 | Amazon-Skills |
| FR-S-03 | 上品计划 | P2 | 调研新发现 |
| FR-RW-01 | 标题改写 | P0 | GitHub 200★+App 4.7★ |
| FR-RW-02 | 描述改写 | P1 | GitHub 326★ |
| FR-RW-03 | SKU改写（五段编码） | P1 | 调研新发现 |
| FR-RW-04 | 图片改写 | P1 | GitHub 1★+App |
| FR-RW-05 | 属性改写 | P2 | 调研新发现 |
| FR-RW-06 | 违禁词检测 | P0 | 调研新发现 |
| FR-P-01 | 插件填表（越南） | P0 | App 4.6★ |
| FR-P-02 | Open API发布 | P3 | 稳定性需求 |
| FR-P-03 | 多站同时发布 | P2 | Crosslist |
| FR-CFG-01 | 模板系统（Type×Platform） | P1 | App规则不同 |
| FR-CFG-02 | 规则库（多维度） | P1 | 调研新发现 |
| FR-CFG-03 | 违禁词库 | P0 | 东南亚规则 |
| FR-CFG-04 | 翻译词库 | P2 | 多语言需求 |

---

文档结束 - 电商AI助手 PRD v3.0.0
调研数据来源：GitHub项目分析 + App Store应用分析
