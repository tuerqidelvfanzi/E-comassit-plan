#Requires -Version 5.1
# ============================================================
#  微软商店反复弹窗 - 一键清理脚本 (管理员权限)
#  作用: 清缓存 / 关自启 / 停后台更新 / 关 Edge PWA 推送
#  使用: 双击同目录下的 "fix-store-popup.bat"
#  作者: Claude  ·  适配: Windows 10 / 11
# ============================================================
[CmdletBinding()]
param([switch]$NoReboot)

function Ok($m)  { Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  [!] $m" -ForegroundColor Yellow }
function Err($m) { Write-Host "  [X] $m" -ForegroundColor Red }
function Head($m){
  Write-Host ""
  Write-Host "== $m ==" -ForegroundColor Cyan
}

$ErrorActionPreference = "Continue"
$failed = 0

Clear-Host
Write-Host "============================================================" -ForegroundColor White
Write-Host "   微软商店反复弹窗 - 一键清理工具" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White


# ---------- 1. 停止相关服务 ----------
Head "1/9 停止 Microsoft Store / Appx 部署服务"
$services = @(
  @{ N="InstallService"; S="Disabled" },
  @{ N="AppXSvc";        S="Manual"   }
)
foreach ($s in $services) {
  try {
    $svc = Get-Service -Name $s.N -ErrorAction Stop
    if ($svc.Status -eq 'Running') {
      Stop-Service -Name $s.N -Force -NoWait -ErrorAction Stop
      Ok "已停止: $($s.N)"
    } else { Ok "未运行: $($s.N) (状态: $($svc.Status))" }
    if ($s.S -eq 'Disabled') {
      Set-Service -Name $s.N -StartupType Disabled -ErrorAction Stop
      Ok "已禁用开机自启: $($s.N)"
    }
  } catch { Warn "跳过 $($s.N): $($_.Exception.Message)"; $failed++ }
}

# ---------- 2. 禁用 AppxDeployment 自动更新计划任务 ----------
Head "2/9 禁用 AppxDeployment 自动更新计划任务"
$disabledCount = 0
try {
  Get-ScheduledTask -ErrorAction Stop |
    Where-Object { $_.TaskPath -like "*AppxDeploymentClient*" -or $_.TaskName -match "WSTask|Store" } |
    ForEach-Object {
      try {
        $_ | Disable-ScheduledTask -ErrorAction Stop | Out-Null
        $disabledCount++
        Ok "已禁用: $($_.TaskPath)$($_.TaskName)"
      } catch {}
    }
  if ($disabledCount -eq 0) { Ok "无相关计划任务 (已干净)" }
} catch { Warn "枚举计划任务失败: $($_.Exception.Message)" }

# ---------- 3. 商店缓存清理 ----------
Head "3/9 清理 Microsoft Store 缓存 (wsreset)"
Warn "将自动调用 wsreset.exe, 期间黑屏闪烁 10~30 秒, 请耐心等待..."
try {
  $p = Start-Process wsreset.exe -PassThru -Wait -ErrorAction Stop
  Ok "商店缓存已重置 (退出码: $($p.ExitCode))"
} catch { Warn "wsreset 执行失败: $($_.Exception.Message)"; $failed++ }


# ---------- 4. 清理 Appx 部署缓存 ----------
Head "4/9 清理 Appx 部署缓存 / 商店包缓存"
$storePkg = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsStore_8wekyb3d8bbwe"
if (Test-Path $storePkg) {
  $subDirs = @("LocalCache", "AC", "Settings", "Temp", "LocalState\Cache", "INetCache")
  foreach ($sd in $subDirs) {
    $full = Join-Path $storePkg $sd
    if (Test-Path $full) {
      try {
        Get-ChildItem $full -Recurse -Force -ErrorAction SilentlyContinue |
          Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Ok "已清: $sd"
      } catch { Warn "部分文件占用跳过: $sd" }
    }
  }
} else { Warn "未找到商店包路径 (可能未安装 Store)" }

$repoPath = "$env:ProgramData\Microsoft\Windows\AppRepository"
if (Test-Path $repoPath) {
  try {
    Get-ChildItem $repoPath -Recurse -Force -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match '\.tmp$|edb\.log$' } |
      Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Ok "已清 AppRepository 临时文件"
  } catch {}
}

# ---------- 5. 清理下载缓存里的 Store 安装包 ----------
Head "5/9 清理下载缓存中的 Store 安装包"
$delivCache = "$env:ProgramData\Microsoft\Windows\DeliveryOptimization"
if (Test-Path $delivCache) {
  Get-ChildItem $delivCache -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { -not $_.PSIsContainer } |
    Remove-Item -Force -ErrorAction SilentlyContinue
  Ok "已清 DeliveryOptimization 缓存"
}
$wsPath = "$env:ProgramData\Microsoft\Windows\WER\ReportQueue"
if (Test-Path $wsPath) {
  Get-ChildItem $wsPath -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "WindowsStore|MicrosoftStore" } |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  Ok "已清 WER ReportQueue 中 Store 相关崩溃报告"
}


# ---------- 6. 关掉 Edge PWA / 商店推送 ----------
Head "6/9 关闭 Edge PWA 推送 / 商店推荐"
$edgePrefs = @(
  "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences",
  "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Secure Preferences"
)
$edgePatched = 0
foreach ($p in $edgePrefs) {
  if (Test-Path $p) {
    try {
      $content = Get-Content $p -Raw -Encoding UTF8
      $before  = $content
      $content = $content -replace '"pwa_install_prompt_enabled":\s*true',    '"pwa_install_prompt_enabled":false'
      $content = $content -replace '"web_app_install_prompt_enabled":\s*true', '"web_app_install_prompt_enabled":false'
      $content = $content -replace '"related_apps":\s*\{[^}]*"installed":\s*true', '"related_apps":{"installed":false'
      if ($content -ne $before) {
        [IO.File]::WriteAllText($p, $content, [Text.UTF8Encoding]::new($false))
        $edgePatched++
        Ok "已更新: $(Split-Path $p -Leaf)"
      }
    } catch { Warn "跳过 $(Split-Path $p -Leaf) (文件被 Edge 占用, 关闭 Edge 再跑一次)" }
  }
}
if ($edgePatched -eq 0) { Ok "Edge 配置无需改动 (或 Edge 正在运行)" }

# 关闭 Edge 通知 / 商店推荐 (注册表)
$regChanges = @(
  @{ P="HKCU:\Software\Microsoft\Edge";                            N="EdgeShopping";                  V=0; T="DWord" },
  @{ P="HKCU:\Software\Microsoft\Edge\PrivacyRecommendations";    N="Enabled";                       V=0; T="DWord" },
  @{ P="HKCU:\Software\Policies\Microsoft\Edge";                  N="PWAInstallEnabled";             V=0; T="DWord" },
  @{ P="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; N="SilentInstalledAppsEnabled";  V=0; T="DWord" },
  @{ P="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; N="SoftLandingEnabled";           V=0; T="DWord" },
  @{ P="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; N="SystemPaneSuggestionsEnabled"; V=0; T="DWord" },
  @{ P="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; N="SubscribedContent-338387Enabled"; V=0; T="DWord" },
  @{ P="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; N="SubscribedContent-338388Enabled"; V=0; T="DWord" },
  @{ P="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; N="SubscribedContent-338389Enabled"; V=0; T="DWord" },
  @{ P="HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"; N="SubscribedContent-353698Enabled"; V=0; T="DWord" },
  @{ P="HKLM:\SOFTWARE\Policies\Microsoft\WindowsStore";          N="AutoDownload";                  V=2; T="DWord" },
  @{ P="HKLM:\SOFTWARE\Policies\Microsoft\WindowsStore";          N="RemoveWindowsStore";            V=0; T="DWord" },
  @{ P="HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent";  N="DisableWindowsConsumerFeatures";V=1; T="DWord" }
)
foreach ($r in $regChanges) {
  try {
    if (-not (Test-Path $r.P)) { New-Item -Path $r.P -Force | Out-Null }
    Set-ItemProperty -Path $r.P -Name $r.N -Value $r.V -Type $r.T -Force
    Ok "注册表: $((Split-Path $r.P -Leaf))\$($r.N) = $($r.V)"
  } catch { Warn "注册表失败: $($r.N)"; $failed++ }
}


# ---------- 7. 杀掉正在跑的相关弹窗进程 ----------
Head "7/9 关闭可能正在弹窗的进程"
$procs = @(
  "MicrosoftStore",
  "WinStore.App",
  "MicrosoftEdge",
  "msedge",
  "MicrosoftEdgeUpdate"
)
$killed = 0
foreach ($name in $procs) {
  Get-Process -Name $name -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      $_ | Stop-Process -Force -ErrorAction Stop
      $killed++
      Ok "已结束: $($_.ProcessName) (PID $($_.Id))"
    } catch { Warn "无法结束: $($_.ProcessName)" }
  }
}
if ($killed -eq 0) { Ok "无可疑进程" }

# ---------- 8. 触发一次手动 GC 释放文件锁 ----------
Head "8/9 释放文件锁 / 等待系统稳定"
[GC]::Collect()
[GC]::WaitForPendingFinalizers()
Start-Sleep -Seconds 2
Ok "系统已就绪"

# ---------- 9. 检查 Edge 是否关闭 ----------
Head "9/9 前置检查 / 重启准备"
$edgeRunning = Get-Process -Name "msedge" -ErrorAction SilentlyContinue
if ($edgeRunning) {
  Warn "Edge 仍在运行, 部分配置需关闭 Edge 后才会生效"
  Warn "脚本结束后请先关闭所有 Edge 窗口再重启电脑"
} else {
  Ok "Edge 已关闭, 配置可完全生效"
}

# ---------- 总结 ----------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  清理完成! 失败项: $failed" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  下一步: " -NoNewline -ForegroundColor Yellow
Write-Host "重启电脑" -ForegroundColor White -BackgroundColor DarkRed
Write-Host ""
Write-Host "  重启后如果还弹, 请截图弹窗(标题栏 + 应用名)发我" -ForegroundColor Yellow
Write-Host ""

# 写日志
$logFile = Join-Path $PSScriptRoot "fix-store-popup.log"
$log = @"
执行时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
失败项: $failed
Edge 运行中: $($null -ne $edgeRunning)
"@
$log | Out-File -FilePath $logFile -Encoding UTF8 -Force
Ok "日志已保存: $logFile"

if ($NoReboot) {
  Write-Host "  [NoReboot 模式] 跳过自动重启" -ForegroundColor Gray
  pause
  exit 0
}

Write-Host ""
Write-Host "  5 秒后自动重启, 按 Ctrl+C 取消..." -ForegroundColor Gray
for ($i = 5; $i -ge 1; $i--) {
  Write-Host "  $i..." -NoNewline -ForegroundColor Gray
  Start-Sleep -Seconds 1
}
Write-Host ""
Write-Host "  正在重启..." -ForegroundColor Cyan
Restart-Computer -Force
