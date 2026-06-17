# 微信与采集项目清单

更新时间：2026-06-13

## D:\ai 顶层项目

| 路径 | 类型 | Git 状态 | 判断 | 建议 |
|---|---|---:|---|---|
| `D:\ai\wechat-automation-api` | Python / Flask / uiautomation | 脏 | 微信 Windows 客户端 HTTP 发送服务 | 保留为 `10-wechat-core`，先处理 `scripts/wechat_controller.py` 改动 |
| `D:\ai\wechat-cli` | Python + npm 包装 | 脏 | 本地微信数据查询、导出、统计 CLI | 保留为核心工具；`output/` 应纳入产物隔离 |
| `D:\ai\wechat-video` | Python 视频处理 | 脏 | 视频号收藏/视频转文字/OCR/LLM 分类/Obsidian 输出 | 保留为 `20-wechat-video` 的处理引擎 |
| `D:\ai\wechat-videopipe` | Python 编排层 | 脏 | 串联 `wechat-cli`、`wechat-video`、`wx_channel` 的流水线 | 作为编排项目保留；新增模块较多，需先做快照 |
| `D:\ai\weichat-aicon` | Tauri / Rust / Python | 脏 | 桌面流程自动化平台，历史名疑似拼写错误 | 归入 `30-desktop-automation`；后续确认是否改名 |
| `D:\ai\wx_channels_download` | Go | 干净 | 微信视频号下载器源码 | 保留为上游/基础下载器，不直接混入业务代码 |
| `D:\ai\wechat-all` | Python | 无 Git | 聚合脚本与输出目录 | 先登记，判断是否为实验拼装层 |
| `D:\ai\wechat-aicon` | 数据/脚本目录 | 无 Git | 疑似早期自动化实验目录 | 和 `weichat-aicon` 比对后再归档或合并 |
| `D:\ai\wx_channel` | 二进制运行目录 | 无 Git | `wx_video_download.exe`、日志、pid、数据库 | 标记为运行时，不作为源码项目管理 |
| `D:\ai\LobsterAI\resources\cfmind\third-party-extensions\openclaw-weixin` | App 内置扩展 | 非顶层 Git | OpenClaw 微信扩展 | 只登记来源，避免直接改 App 资源 |
| `D:\ai\LobsterAI\resources\cfmind\third-party-extensions\wecom-openclaw-plugin` | App 内置扩展 | 非顶层 Git | 企业微信 OpenClaw 扩展 | 只登记来源，避免直接改 App 资源 |

## 当前仓库相关项目

| 路径 | 类型 | Git 状态 | 判断 | 建议 |
|---|---|---:|---|---|
| `D:\02-学习\06-yitang\app\ecommerce-scraper` | Python | 父仓库未跟踪 | 双轨电商采集器，本地 + Apify 对比 | 纳入 `40-commerce-data`；先决定是否独立成 Git 仓库 |
| `D:\02-学习\06-yitang\app\scoutspy` | Python | 子仓库干净 | `ecommerce-scraper` 的整理/发布版候选 | 作为采集线主仓候选，和 `ecommerce-scraper` 做差异对比 |

## 已观察到的风险

1. 多个项目工作区是脏的，直接搬迁容易丢上下文。
2. `wechat-video` 和 `wechat-videopipe` 存在 `third_party/`、示例、配置改动，源码与依赖边界需要拆清。
3. `wechat-cli` 有导出脚本、MCP 目录和 `output/`，需要区分工具能力与生成产物。
4. `wx_channel` 是运行时目录，不适合当源码根管理。
5. `weichat-aicon` 与 `wechat-aicon` 命名相近，可能是同一方向的不同阶段，需要人工确认主线。

## 建议优先级

| 优先级 | 项目 | 原因 |
|---:|---|---|
| P0 | `wechat-cli`、`wechat-automation-api` | 微信数据读取与发送能力，是其他项目的基础 |
| P1 | `wx_channels_download`、`wechat-video`、`wechat-videopipe` | 视频号下载和知识库化链路已经成体系 |
| P2 | `ecommerce-scraper`、`scoutspy` | 电商采集线可与主仓业务结合，但应独立治理 |
| P3 | `wechat-all`、`wechat-aicon`、`weichat-aicon` | 历史实验/平台化方向，需要先去重 |
| P4 | LobsterAI/OpenClaw 内置扩展 | 属于应用资源或三方扩展，登记即可 |
