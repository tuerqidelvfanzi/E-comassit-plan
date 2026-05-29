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
2. 插件选项（或 popup）将令牌存入 `chrome.storage` 键 `extensionToken`
3. 配置 `apiBaseUrl` 指向你的 API 根（如 `https://api.example.com`）

上传优先级：**API（带令牌）→ B 站页内桥接 → demoImport 跳转**。

## 测试

```bash
cd api && npm test
cd web && npm test && npm run test:e2e
```
