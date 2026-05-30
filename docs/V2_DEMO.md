# v2 演示说明

> 版本：v2.0–v2.3 全 Mock · GitHub Pages / 本地均可浏览

## 登录

- 账号：`admin01`
- 密码：`abcd234`

## 架构

| 层 | 路径 | 说明 |
|----|------|------|
| Web v2 UI | `web/src/v2/` | 页面、Hooks、Mock 客户端 |
| API v2 Mock | `api/src/v2/` | `/api/v1/v2/*` 内存 Mock |
| v1 保留 | `web/src/pages/SettingsPage` 等 | 设置、插件、LLM、主题 |

## 本地启动

```bash
# 终端 1 — API
cd api && npm install && npm run db:migrate && npm run dev

# 终端 2 — Web
cd web && npm install && npm run dev
```

打开 http://localhost:3004 ，登录后侧边栏为 **v2 导航**。

## GitHub Pages

静态站点无 API 时，`web/src/v2/api-local.ts` 在浏览器内提供同等 Mock。

若配置了远程 API（`VITE_API_URL`），则调用 `api/src/v2` 路由。

## 功能对照（均为 Mock）

| 里程碑 | 页面 | API |
|--------|------|-----|
| v2.0 | 工作台、采集箱、处理工作台、模板、发布 | `/v2/overview`, `/v2/products/:id/pipeline` |
| v2.1 | 竞品分析、选品洞察、规则库 | `/v2/competitor-jobs`, `/v2/insights/dashboard` |
| v2.2 | 链接直采、批量采集 | `/v2/link-collect` |
| v2.3 | 平台集成、团队 | `/v2/integrations/open-api`, `/v2/team/members` |

## 推荐演示路径

1. **竞品分析** → 新建任务 → 运行分析  
2. **采集箱** → 进入商品 **工作台** → 运行管线 → 查看双指标 SKU  
3. **发布中心** → 模拟填表  
4. **设置** → 插件下载与 LLM 配置（v1 能力）
