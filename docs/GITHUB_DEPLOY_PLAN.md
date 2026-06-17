# GitHub 上传与自动部署规划（前后端分阶段）

## 当前可落地（前端原型阶段）

- 仓库上传：代码推送到 GitHub
- 自动构建：已提供 `/.github/workflows/web-build.yml`
- 触发分支：`develop` 与 `main`
- 目标：每次 PR 自动检查 `web/` 的安装、类型检查、构建

## 后续自动部署建议

### 方案 A（推荐）：Cloudflare Pages / Vercel 托管前端

1. GitHub 连接托管平台
2. 指定项目目录 `web`
3. 构建命令：`npm run build`
4. 输出目录：`dist`
5. 生产分支：`main`，预览分支：`develop`

### 方案 B：GitHub Actions + 自有服务器

1. Actions 构建 `web/dist`
2. 通过 SSH / Rsync 上传到 Nginx 静态目录
3. 使用环境变量区分 `VITE_PROXY_TARGET`

## 后端未来接入（预留）

- 后端目录建议：`server/`
- 后端 CI/CD 建议独立 workflow：`backend-build.yml`
- 前后端联动采用 OpenAPI 版本化，避免破坏前端原型演示

## 建议分支策略

- `main`: 线上稳定
- `develop`: 集成测试
- `feature/*`: 功能分支（如 `feature/prototype-dataset`）

## 安全与密钥

- GitHub Secrets 存放部署密钥，不入库
- 插件 Token、Cookie 不进入仓库
- 后端发布密钥与前端发布密钥分开管理
