# GitHub 对标项目与最佳实践

更新时间：2026-06-13

## 对标项目

| 本机方向 | GitHub 对标 | 可借鉴点 |
|---|---|---|
| 微信机器人 / 自动化 SDK | https://github.com/wechaty/wechaty | `src`、`examples`、`docs`、`tests` 分层清楚；支持 Docker；README 明确运行方式和协议适配 |
| 微信 Hook / 多客户端能力 | https://github.com/lich0821/WeChatFerry | 核心能力与 `clients` 解耦；Python/HTTP/NodeJS/Rust 等客户端分层；文档、免责声明、示例入口明确 |
| 微信聊天记录留存 | https://github.com/LC044/WeChatMsg | 强调数据归属与导出场景；适合作为个人数据中心/知识库方向参考 |
| 视频号下载器 | https://github.com/ltaoo/wx_channels_download | Go 项目采用 `cmd`、`internal`、`pkg`、`docs`、`build` 分层；运行说明和打包说明清楚 |
| 电商/网页采集框架 | https://github.com/apify/crawlee | `packages`、`docs`、`test`、`website` 分离；持久化队列、结果存储、代理轮换等采集基础设施完整 |
| 采集项目模板 | https://github.com/apify/actor-templates | `templates`、`agent-bases`、`dist`、`scripts` 分层；通过模板清单和自动化构建传播项目规范 |

## 推荐落地方式

### 1. 微信项目分成 SDK、Client、App 三层

参考 WeChatFerry 和 Wechaty，不要把微信控制、HTTP API、CLI、MCP、桌面 UI 混在同一个源码层。

建议：

```text
wechat-core/
  packages/
    wechat-controller/
    wechat-http-api/
    wechat-cli-adapter/
  clients/
    python/
    node/
    mcp/
  examples/
  docs/
  tests/
```

本机映射：

- `wechat-automation-api`：更像 `wechat-http-api` + `wechat-controller`
- `wechat-cli`：更像 `wechat-cli-adapter`
- `wechat-all`：如果继续保留，应变成 `examples/` 或 `recipes/`，不要当主项目

### 2. 视频号链路分成下载器、处理器、编排器

参考 `wx_channels_download` 的 Go 分层，把底层下载器和上层业务流水线隔离。

建议：

```text
wechat-video-suite/
  downloader/
    wx_channels_download/
  processor/
    wechat-video/
  orchestrator/
    wechat-videopipe/
  runtime/
    wx_channel/
  docs/
  examples/
```

本机映射：

- `wx_channels_download`：源码下载器，保持干净上游
- `wx_channel`：运行时目录，只放二进制、日志、pid、db，不进源码层
- `wechat-video`：视频转写、OCR、LLM 分类、Obsidian 输出
- `wechat-videopipe`：串联 CLI、下载器和处理器的编排层

### 3. 采集器项目按模板化 Actor 管

参考 Apify/Crawlee：采集项目应有统一入口、配置、存储、测试和模板。

建议：

```text
commerce-data/
  scrapers/
    ecommerce-scraper/
    scoutspy/
  templates/
    python-scraper/
    crawlee-playwright/
  storage/
    .gitkeep
  docs/
  tests/
```

关键规则：

- 把 `data/outputs`、`storage`、日志、缓存从源码中隔离。
- 每个平台采集器保持同一接口：`fetch`、`normalize`、`compare`、`export`。
- 对需要登录或反爬的平台，优先官方 API 或用户授权数据；公开抓取只作为低优先级策略。

### 4. 每个项目必须有同一套治理文件

借鉴成熟开源仓库的基础结构，每个主项目至少要有：

```text
README.md
CHANGELOG.md
LICENSE
.gitignore
.env.example
docs/
examples/
tests/
```

对私有/实验项目，`LICENSE` 可先省略，但 `README.md`、`.gitignore`、`.env.example` 不应省。

### 5. 对脏工作区先快照，不急着重构

当前多个本机项目都有未提交改动。最佳做法是先把每个项目的状态记录下来：

```text
registry/
  PROJECTS.md
  STATUS.md
  DECISIONS.md
  snapshots/
    2026-06-13-wechat-cli.md
    2026-06-13-wechat-video.md
```

每个快照记录：

- 当前分支
- 是否跟踪远端
- 修改文件
- 新增文件
- 输出/缓存目录
- 可运行命令
- 风险备注

## 我建议采用的本地项目树

```text
D:\ai-projects\
  00-registry\
  10-wechat-core\
  20-wechat-video\
  30-desktop-automation\
  40-commerce-data\
  80-app-integrations\
  90-archive\
  99-vendor\
```

迁移顺序：

1. 只生成索引和快照。
2. 清理 `.gitignore`，让输出目录不再污染状态。
3. 为脏仓库分别创建实验提交或功能分支。
4. 用复制方式迁移到新树，原目录保留到验证完成。
5. 验证运行入口后，再决定是否归档旧目录。
