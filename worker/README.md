# Collect Worker

批量 TOP10 采集由 **API 服务内 Playwright** 执行（`api/src/worker/batchCollect.ts`）。

本目录 CLI 仅用于在已部署 API 上**重新触发**任务：

```bash
cd worker
API_URL=https://your-api.example.com TOKEN=<jwt> npm run run -- run batch-xxx
```

部署 API 时需安装 Chromium：`npx playwright install chromium`

环境变量：

| 变量 | 说明 |
|------|------|
| `ENABLE_BATCH_WORKER` | 设为 `false` 禁用 Worker |
| `BATCH_WORKER_SIMULATE` | 设为 `true` 不启浏览器，仅模拟结果 |
| `PLAYWRIGHT_HEADLESS` | 默认 `true` |
