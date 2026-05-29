# 界面主题配置

在 **设置 → 界面主题** 中切换预设或编写自定义 CSS。选择保存在浏览器 `localStorage`：

- 主题 ID：`psa_theme`
- 自定义 CSS：`psa_theme_custom_css`

## 预设主题

| 选项 | ID | 说明 |
|------|-----|------|
| 当前浏览器配置 | `browser` | 跟随系统浅色/深色 |
| 阳光墨玉 | `solarized` | Solarized Dark |
| 赛博朋克 | `cyberpunk` | 霓虹青 + 黄顶栏 |
| 翡翠暗绿 | `jade` | 墨绿玉石质感 |
| 日光暖白 | `sunlight` | 暖米纸感浅色 |
| 落日橙黑 | `sunset` | 深灰 + 落日橙强调 |
| 羊皮纸 | `parchment` | 古籍手稿琥珀棕 |
| 自定义 CSS | `custom` | 下方编辑区，本机保存 |

## 自定义 CSS

在 `:root[data-theme='custom']` 中覆盖语义变量即可，例如：

```css
:root[data-theme='custom'] {
  --color-bg: #051F18;
  --color-surface: #0B2E24;
  --color-text: #A7F3D0;
  --color-primary: #34D399;
  --color-border: #064E3B;
}
```

### 可用语义变量（节选）

| 变量 | 用途 |
|------|------|
| `--color-bg` | 页面背景 |
| `--color-surface` | 卡片/侧栏 |
| `--color-text` | 正文 |
| `--color-text-muted` | 次要文字 |
| `--color-primary` | 主按钮/链接 |
| `--color-topbar` / `--color-topbar-fg` | 侧栏顶栏 |
| `--color-border` | 边框 |
| `--shadow-card` | 卡片阴影 |

完整定义见 `web/src/styles/themes.css`。

## 实现文件

- `web/src/styles/themes.css` — 预设主题变量
- `web/src/lib/theme.ts` — 切换、自定义 CSS 注入
- `web/src/components/ThemeSettings.tsx` — 设置页 UI
