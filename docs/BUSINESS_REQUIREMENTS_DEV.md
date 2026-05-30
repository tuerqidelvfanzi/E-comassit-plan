# 电商商品采集优化搬家系统 - 开发级需求文档

> 版本：v1.1 | 日期：2026-05-30 | 状态：需求确认

---

## 一、业务背景与目标

### 1.1 三个核心功能

| 功能 | 说明 |
|------|------|
| 选品 | 从源平台采集商品数据 |
| 优化 | LLM+模板本地化优化 |
| 搬家 | 浏览器插件自动填表发布 |

### 1.2 目标用户
- 跨境买家/小微个体卖家
- 目标市场：东南亚（越南、泰国、菲律宾、印尼）
- 目标平台：TikTok Shop、Shopee

## 二、完整业务流程

选品 -> 采集 -> 优化 -> 搬家

1. 选品阶段：从抖音商城、淘宝、拼多多等筛选爆款
2. 采集阶段：浏览器插件采集图片(9-12张)、SKU(颜色x尺码)
3. 优化阶段：LLM处理标题描述、价格计算、本地化翻译
4. 搬家阶段：插件自动填表到目标平台草稿箱

---

## 三、越南Shopee上品流程

### 3.1 整体流程

1. 启动店八方应用 -> 登录账号
2. 点击上货 -> 进入采集箱
3. 编辑未发布的产品链接
4. 编辑产品标题（越南语，<=20字符）
5. 编辑简易描述（删除国内标识）
6. 编详细描述（优化文案）
7. 选择产品类目（必填项）
8. 编辑SKU（售价x350%，库存50）
9. 编辑产品图片（9张，翻译+消除笔）
10. 编辑物流信息
11. 保存修改越南
12. 一键翻译越南语
13. 发布产品

### 3.2 标题规则

越南站限制字符为20字，汉字需要删减到10-9字以内。

规则：
1. 保留最重要的字符，如可爱蓝色小熊简写成蓝色/熊
2. 删除其他多余的描述
3. 规格翻译字数太多可改成A款B款C款
4. 每个不同类型字符用/分开
5. 一般有两个规格，都要注意修改
6. 超出20字符可用其他翻译工具

### 3.3 SKU编辑规则

售价编辑：点击售价批量 -> 使用公式 -> 当前价格 x350%

库存编辑：点击库存批量 -> 统一设置为50

### 3.4 图片处理规则

需要保留：外观、参数、安装步骤、尺寸、使用场景图片（共九张）

需要删除：厂家介绍、关于我们、证书资质、运输售后、包邮、免费开票、品牌标识

图片处理流程：
1. 挑选前9张图片修改尺寸1:1（800*800）
2. 用消除笔P掉敏感内容（终身质保、免费退货、LOGO、水印）
3. 点击图片翻译，选择中->越进行翻译
4. 手动调整译图，优化图片面板整洁
5. 检查是否还有中文字体残留

---

## 四、泰国TikTok上品流程

### 4.1 整体流程

1. 产品管理 -> 增加新产品
2. 上传主图（最少5张）
3. 编辑标题（参考Tk同行）
4. 选择类目（T-shirts）
5. 选择品牌（无品牌）
6. 设置变体（颜色+尺码）
7. 设置SKU编码
8. 设置规格模板
9. 上传详情图
10. 发布产品

### 4.2 SKU编码规则（五部分）

格式：{PREFIX}-{SEQUENCE}-{SIDE}-{COLOR}-{SIZE}

示例：BF-0001-PR-WH-BK-S

各部分说明：
1. PREFIX（名字）：店铺名前缀，如BF T-shirt -> BF
2. SEQUENCE（编号）：0001-1000
3. SIDE（正反面）：P=正面有图案，R=背面有图案，PR=正反面都有
4. COLOR（颜色）：WH=白色，BK=黑色
5. SIZE（尺码）：S、M、L、XL、XXL、XXXL

### 4.3 颜色编码表

| 颜色 | 编码 |
|------|------|
| 白色 | WH |
| 黑色 | BK |
| 红色 | RD |
| 蓝色 | BL |
| 绿色 | GR |
| 黄色 | YL |
| 粉色 | PK |
| 紫色 | PU |
| 橙色 | OR |
| 灰色 | GY |

### 4.4 白色钩子

当商品只有一个款式时需要添加白色钩子：
- 颜色名称：empty
- SKU格式：{PREFIX}-9999-P-WH-{SIZE}
- 价格：400
- 数量：5
- 重量：220

---

## 五、数据字段定义

### 5.1 Product

- id: 唯一ID
- title: 原标题
- description: 原描述
- source: 来源平台(taobao|tmall|pinduoduo|1688|douyin)
- sourceUrl: 原商品链接
- priceCny: 原价(人民币)
- images[]: 图片列表
- skus[]: SKU变体列表
- attributes[]: 属性列表
- status: raw|processing|ready|published
- targetLocale: 目标语言(vi-VN|th-TH|id-ID|fil-PH)
- categoryId: 类目模板ID
- hasVariants: 是否有变体
- processed: 处理结果

### 5.2 ProductImage

- id: 图片ID
- url: 原图URL
- localPath: 本地存储路径
- type: main|detail|sku
- sort: 排序
- hasWatermark: 是否有水印
- priceTag: 是否含价格标签
- sensitiveContent: 敏感内容列表
- status: pending|downloaded|processed|translated

### 5.3 ProductSku

- id: SKU ID
- name: SKU名称
- color: 颜色
- size: 尺码
- price: 价格
- stock: 库存
- skuCode: SKU编码
- weight: 重量(克)
- patternSuffix: P|R|PR（正反面）
- isDummyHook: 是否白色钩子

### 5.4 ProcessedResult

- exposure: 高曝光向输出
- conversion: 高转化向输出
- selectedOutput: 选中的输出
- ranAt: 处理时间
- templateId: 模板ID
- modelUsed: 使用的模型

### 5.5 ProcessedOutput

- title: 优化后标题
- shortDescription: 简短描述（越南站20字限制）
- description: 优化后描述
- priceLabel: 价格标签
- charCount: 标题字符数

---

## 六、类目模板定义

### 6.1 模板类型

| 模板ID | 名称 | 分类 | 特殊字段 |
|--------|------|------|----------|
| tpl-clothing-tshirt | 服装-T恤 | clothing-tshirt | SKU五部分编码 |
| tpl-clothing-general | 服装-通用 | clothing-general | 面料属性 |
| tpl-kitchenware | 厨具 | kitchenware | 材质/尺寸 |
| tpl-lighting | 灯具 | lighting | 电压/保修期 |
| tpl-beauty | 美妆 | beauty | 规格/保质期 |
| tpl-electronics | 3C电子 | electronics | 型号/参数 |
| tpl-home | 家居 | home | 尺寸/材质 |
| tpl-other | 通用模板 | other | 无 |

### 6.2 服装-T恤模板

**SKU配置**：
- prefix: 店铺名前缀（如BF）
- sequenceStart: 编号起始（如1）
- colors: 颜色列表（WH白色/BK黑色/PK粉色等）
- sizes: 尺码列表（S/M/L/XL/XXL/XXXL）
- sides: 正反面（P/R/PR）

**白色钩子配置**：
- enabled: true
- colorName: empty
- price: 400
- stock: 5
- weight: 220

### 6.3 越南Shopee模板

- 价格公式：x3.5
- 标题限制：20字符
- 默认库存：50

---

## 七、价格计算公式

### 7.1 东南亚市场倍率

| 国家 | 平台 | 倍率 | 公式 |
|------|------|------|------|
| 越南 | Shopee | 350% | 售价 = 原价 x 3.5 |
| 泰国 | TikTok | 250% | 售价 = 原价 x 2.5 |
| 菲律宾 | Shopee | 固定500 | 售价 = 500 |

### 7.2 库存设置

| 国家 | 默认库存 |
|------|----------|
| 越南 | 50 |
| 菲律宾 | 800 |

### 7.3 重量设置

| 国家 | 默认重量(克) |
|------|-------------|
| 越南 | 220 |
| 菲律宾 | 220 |

---

## 八、违禁内容检查清单

### 8.1 图片敏感内容

需用消除笔处理掉的内容：
- 终身质保、免费退货、包邮
- 免费开票、商家LOGO、水印
- 厂家介绍、关于我们、证书资质
- 运输售后内容

### 8.2 标题/描述敏感内容

品牌类（防侵权）：
耐克/Nike, 阿迪达斯/Adidas, 迪士尼/Disney, LV, Gucci, Chanel, 爱马仕, 苹果, 三星, 华为, NASA（除非联名授权）

国内相关标识（东南亚需删除）：
3C认证、产地、发货地、品牌名称（除非无品牌）

---

## 九、types.ts 修改清单

### 9.1 新增/扩展类型

1. TargetLocale扩展：新增id-ID, fil-PH

2. Product扩展：新增hasVariants, skuCount, imageCount, categoryId

3. ProcessedOutput扩展：新增shortDescription（越南站20字限制）, charCount

4. SkuConfig新增：prefix, sequenceStart, colors, sizes, sides, dummyHook

5. ProductSku扩展：新增weight, patternSuffix, isDummyHook

6. ProductImage扩展：新增sensitiveContent

---

## 十、待开发功能清单

### P0 核心闭环

| 功能 | 页面 | 说明 |
|------|------|------|
| 商品采集 | Extension | 从1688/淘宝/拼多多采集 |
| 采集箱 | InboxPage | 展示+筛选+批量操作 |
| 工作台 | WorkbenchPage | LLM处理+结果展示 |
| 发布任务 | PublishPage | 创建+查看状态 |
| 插件填表 | Extension | 自动填入目标平台 |

### P1 完善功能

| 功能 | 页面 | 说明 |
|------|------|------|
| 模板管理 | TemplatesPage | 完整CRUD模板（含SKU配置） |
| SKU管理 | WorkbenchPage | 变体编辑+编码生成 |
| 图片处理 | WorkbenchPage | 图片列表+消除笔+翻译 |
| 批量采集 | BatchCollectPage | 榜单批量采集 |

---

## 附录：上品流程图

### Shopee越南站流程

1. 启动店八方应用 -> 登录账号
2. 点击上货 -> 进入采集箱
3. 编辑未发布的产品链接
4. 编辑产品标题（越南语，<=20字符）
5. 编辑简易描述（删除国内标识）
6. 编详细描述（优化文案）
7. 选择产品类目（必填项）
8. 编辑SKU（售价x350%，库存50）
9. 编辑产品图片（9张，翻译+消除笔）
10. 编辑物流信息
11. 保存修改越南
12. 一键翻译越南语
13. 发布产品

### TikTok泰国流程

1. 产品管理 -> 增加新产品
2. 上传主图（>=5张）
3. 编辑标题（参考Tk同行）
4. 选择类目（T-shirts）
5. 选择品牌（无品牌）
6. 设置变体（颜色+尺码）
7. 设置SKU编码（五部分）
8. 设置规格模板
9. 上传详情图（4张固定+补图）
10. 发布产品

---

*文档结束*
