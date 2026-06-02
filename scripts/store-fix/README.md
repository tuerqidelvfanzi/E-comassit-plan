# 微软商店反复弹窗 - 一键清理工具

> 适用于 Windows 10 / 11 反复弹出 Microsoft Store 推荐/更新窗口的问题。

## 使用方法 (3 步)

1. 打开 `scripts/store-fix/` 目录
2. **双击 `一键清理微软商店弹窗.bat`**
   - 会自动弹 UAC 提权, 点 "是"
   - 弹出确认窗口, 按任意键继续
   - 等待 30 秒, 自动重启电脑
3. 重启后, 弹窗应该不再出现

## 如果想撤回 (恢复默认)

- **双击 `撤销清理.bat`** → 自动提权 → 一键恢复

## 它做了什么 (9 步)

| 步骤 | 操作 | 目的 |
|------|------|------|
| 1 | 停 `InstallService` / `AppXSvc` | 阻止 Store 后台拉起 |
| 2 | 禁用 AppxDeploymentClient 计划任务 | 杀掉自动更新循环 |
| 3 | `wsreset.exe` | 官方缓存重置 |
| 4 | 清 Store 包本地缓存 (LocalCache/AC/Temp) | 清掉崩溃后的死循环状态 |
| 5 | 清 DeliveryOptimization / WER 报告 | 清理下载残留 |
| 6 | 改 Edge Preferences + 注册表 | 关闭 PWA 推送 / 商店推荐 |
| 7 | Kill 进程 (Store / Edge / EdgeUpdate) | 立刻停止当前弹窗 |
| 8 | GC + 等待 | 释放文件锁 |
| 9 | 检查 Edge 状态 | 提示是否需要关闭 Edge |

## 修改的注册表 (撤销时会还原)

- `HKCU\Software\Microsoft\Edge\EdgeShopping` = 0
- `HKCU\Software\Microsoft\Edge\PrivacyRecommendations\Enabled` = 0
- `HKCU\Software\Policies\Microsoft\Edge\PWAInstallEnabled` = 0
- `HKCU\...\ContentDeliveryManager\SilentInstalledAppsEnabled` = 0
- `HKCU\...\ContentDeliveryManager\SoftLandingEnabled` = 0
- `HKCU\...\ContentDeliveryManager\SystemPaneSuggestionsEnabled` = 0
- `HKCU\...\ContentDeliveryManager\SubscribedContent-{338387,338388,338389,353698}Enabled` = 0
- `HKLM\...\Policies\Microsoft\WindowsStore\AutoDownload` = 2 (永不自动下载)
- `HKLM\...\Policies\Microsoft\Windows\CloudContent\DisableWindowsConsumerFeatures` = 1

## 如果清理后还弹

请把弹窗截图发我, 重点:
- 标题栏文字
- 里面显示的应用名/品牌
- 窗口大小 (是全屏还是小窗)

常见情况:
- **小窗** (200x300 左右) → 来自某个 UWP 应用, 检查最近安装的应用
- **全屏** → Edge 浏览器, 检查 `edge://settings/privacy` 里的"应用"和"通知"开关
- **伪装弹窗** (网页样式) → 可能是恶意软件, 跑 Windows Defender 全盘扫描

## 原理

微软商店弹窗的反复触发链路:
```
AppxDeploymentClient 计划任务 (深夜触发)
    ↓
下载 Store 更新包
    ↓
MicrosoftStore.exe 启动
    ↓
弹"获取新应用"窗口
    ↓
被用户拒绝 → 标记为"未完成" → 下个周期再弹
```

本脚本切断前 3 个环节, 让循环无法重启。
