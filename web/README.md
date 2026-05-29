# 商品选品助手 — Web 原型

可点击的 B 站线框原型，技术栈轻量版（React + Vite + Tailwind v4）。完整工程化请逐步对齐 `frontend-stack-reference-pack`。

## 启动

```bash
cd web
npm install
npm run dev
```

浏览器打开 http://localhost:3004/login（本地 `base` 为 `/`）

**GitHub Pages 请访问（带仓库名路径）：**  
https://tuerqidelvfanzi.github.io/E-comassit-plan/login

- 用户名：`admin01`
- 密码：`abcd234`

## GitHub Pages 部署（已配好）

1. 把整个项目推到 GitHub（仓库 **Public**）。
2. 进入仓库 Settings → Pages：
   - Build and deployment 选择 **GitHub Actions**。
3. 推送到 `main` 后会自动发布。

发布地址形如：`https://<你的用户名>.github.io/<仓库名>/`

## 页面

| 路径 | 说明 |
|------|------|
| `/login` | 登录 |
| `/app` | 工作台 |
| `/app/inbox` | 采集箱 |
| `/app/workbench/:id` | 处理工作台（规则 + 模板 + 临时 Prompt） |
| `/app/templates` | 类目模板 |
| `/app/rules` | 规则库 |
| `/app/insights` | 选品洞察 |
| `/app/publish` | 发布中心 |
| `/app/settings` | 插件与模型设置 |

## 下一步

1. 数据集：`src/data/mock-dataset.json`（采集/规则/发布任务全量原型数据）。
2. GitHub 自动构建：`../.github/workflows/web-build.yml`。
3. 自动部署规划：`../docs/GITHUB_DEPLOY_PLAN.md`。
4. 按 `docs/API_OUTLINE.md` 接真实 API，并逐步替换 mock。
