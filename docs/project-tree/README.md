# 项目树管理入口

更新时间：2026-06-13

## 结论

需要一个专门的项目树来管理这些项目，但第一阶段不建议直接搬目录。

当前 `D:\ai` 下的微信相关项目已经形成多条产品线：微信消息自动化、微信本地数据 CLI、视频号下载、视频处理流水线、桌面流程自动化，以及 OpenClaw/LobsterAI 内置的微信/企业微信扩展。再加上当前仓库里的 `ecommerce-scraper`，如果继续散放，后续会出现职责重叠、重复实验脚本堆积、依赖版本漂移、Git 状态不可控的问题。

## 管理原则

1. 先登记，再迁移：先维护索引和状态，不直接移动或删除目录。
2. Git 仓库优先：有 `.git` 的项目保持原仓库边界，先清点改动再决定提交、拆分或归档。
3. 运行产物隔离：`output/`、日志、缓存、二进制运行目录不进入核心源码层。
4. 三方代码标注：`third_party/`、App 内置资源、下载器镜像只登记来源，不在主项目里直接改。
5. 统一命名：微信相关项目统一用 `wechat-*` / `wx-*`，历史拼写如 `weichat-aicon` 先登记，后续再决定是否重命名。

## 建议目标树

```text
D:\ai-projects\
  00-registry\
    PROJECTS.md
    STATUS.md
    DECISIONS.md
  10-wechat-core\
    wechat-automation-api\
    wechat-cli\
    wechat-all\
  20-wechat-video\
    wx_channels_download\
    wx_channel-runtime\
    wechat-video\
    wechat-videopipe\
  30-desktop-automation\
    wechat-aicon\
    weichat-aicon\
  40-commerce-data\
    ecommerce-scraper\
    scoutspy\
  80-app-integrations\
    openclaw-weixin\
    wecom-openclaw-plugin\
  90-archive\
  99-vendor\
```

这个树是目标形态，不是当前已执行的文件操作。

## 当前索引

项目清单见 `PROJECTS.md`。

## 下一步

1. 给每个有 Git 的项目生成一次基线状态快照。
2. 把无 Git 的项目分成：源码、运行时、缓存/输出、历史资料。
3. 对脏工作区逐个判断：保留为功能分支、提交为实验快照、或转入归档。
4. 确认目标根目录后，再用非破坏方式复制/迁移，原目录保留到验收完成。
