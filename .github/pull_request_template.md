## 变更类型

- [ ] 插件 (`extension/`)
- [ ] Web (`web/`)
- [ ] 采集数据契约（`docs/COLLECT_SCHEMA.md` + `shared/schemas/`）
- [ ] 文档 only
- [ ] 其他

## 说明



## 契约检查（采集相关必填）

- [ ] 未改契约，或已 bump `schemaVersion` 并双人确认
- [ ] 插件输出 / Web 类型 与 `normalized-product.schema.json` 一致
- [ ] 若改契约：已同步 `collectTypes.ts`、`normalize.js`、`COLLECT_SCHEMA.md`

## 联调（插件或采集箱 PR 建议填写）

<details>
<summary>NormalizedProduct 样例 JSON</summary>

```json

```

</details>

## 测试

- [ ] `cd web && npm run lint`
- [ ] `cd web && npm run build`（含 zip:extension）
- [ ] 浏览器手测（页面 URL）
