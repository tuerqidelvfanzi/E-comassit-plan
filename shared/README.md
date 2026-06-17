# shared — 跨端契约（非业务代码）

本目录仅存放 **插件、Web、API、Worker 共用** 的契约文件，避免在 `extension/` 与 `web/` 各维护一份。

| 文件 | 说明 |
|------|------|
| `schemas/normalized-product.schema.json` | 采集商品 JSON Schema v1.0.0 |

人读说明见 `docs/COLLECT_SCHEMA.md`。  
双人协作见 `docs/DEV_SPLIT.md`。

**勿**在此目录放插件或 React 业务逻辑。
