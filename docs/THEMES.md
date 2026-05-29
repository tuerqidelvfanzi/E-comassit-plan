# 界面主题配置

在 **设置 → 界面主题** 中可切换三种 CSS 主题，选择后保存在浏览器 `localStorage`（键名 `psa_theme`）。

| 选项 | ID | 说明 |
|------|-----|------|
| 当前浏览器配置 | `browser` | 跟随系统 `prefers-color-scheme`，浅色/深色自动切换 |
| 阳光墨玉 | `solarized` | Solarized Dark：主背景 #002b36、卡片 #073642、主按钮 #268bd2、成功 #859900、警示 #dc322f |
| 赛博朋克 | `cyberpunk` | 深紫底 #0a0a12、黄顶栏 #fcee0a、霓虹青按钮 #00f0ff、品红强调 #ff2a6d |

实现文件：

- `web/src/styles/themes.css` — CSS 变量定义
- `web/src/lib/theme.ts` — 切换与持久化
- `web/src/components/ThemeSettings.tsx` — 设置页选择器

扩展新主题：在 `themes.css` 增加 `:root[data-theme='xxx']`，并在 `THEME_OPTIONS` 中注册。
