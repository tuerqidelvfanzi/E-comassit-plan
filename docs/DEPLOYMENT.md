# 部署指南（生产）

## 架构

| 组件 | 说明 |
|------|------|
| `web/` | React SPA，可部署 GitHub Pages / Cloudflare Pages |
| `api/` | Hono + SQLite REST API，需 Node 或 Docker |
| `extension/` | Chrome MV3，ZIP 由 `npm run zip:extension` 生成 |

## 本地全栈

```bash
# 终端 1：API
cd api && npm install && npm run dev

# 终端 2：Web（Vite 代理 /api/v1 → :8080）
cd web && npm install && npm run dev
```

或使用 Docker Compose：

```bash
docker compose up --build
```

访问 http://localhost:3004 ，登录 `admin01` / `abcd234`。

## GitHub Pages（仅前端）

静态构建默认 **本地存储模式**（`VITE_FORCE_LOCAL_API` 未设置且无 `VITE_API_URL`）。

若已部署 API，在仓库 Settings → Secrets 中配置 `VITE_API_URL`，并在 `deploy-pages.yml` 传入该变量。

## API 生产环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `JWT_SECRET` | 是 | JWT 签名密钥 |
| `DATABASE_PATH` | 否 | SQLite 路径，默认 `./data/app.db` |
| `PORT` | 否 | 默认 8080 |

## 插件配置

1. B 站登录 → 设置 → 复制 **插件连接令牌**
2. Popup 填入 **API 地址** 与 **插件令牌**
3. 批量采集前：在淘宝/1688 已登录页点击 **「同步 Cookie」**

上传优先级：**API（带令牌）→ B 站页内桥接 → demoImport 跳转**。

## 批量采集 TOP10（Collect Worker）

- B 站菜单 **批量采集**：填写搜索/榜单 URL，勾选确认后创建任务
- API 内 `Playwright` 执行：`POST /api/v1/collect-jobs/batch`
- 参数：`maxItems`≤20，`delayMs` 250–2400，可选 `useCookies`
- 部署 API 镜像需包含 Chromium（见 `api/Dockerfile`）
- 环境变量 `ENABLE_BATCH_WORKER=false` 可关闭；`BATCH_WORKER_SIMULATE=true` 仅模拟

## 淘宝卖家 DOM

选择器配置：`shared/selectors/taobao-seller.json`  
插件发布填入已内置；API `GET /extension/selectors` 可热更新。

## 测试

```bash
cd api && npm test
cd web && npm test && npm run test:e2e
```
