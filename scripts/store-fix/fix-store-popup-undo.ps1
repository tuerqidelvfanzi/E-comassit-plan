#Requires -Version 5.1
# ============================================================
#  撤销清理 - 恢复 Microsoft Store / Appx 默认状态
#  使用: 双击同目录下的 "撤销清理.bat"
# ============================================================
[CmdletBinding()]

function Ok($m)  { Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  [!] $m" -ForegroundColor Yellow }
function Head($m){
  Write-Host ""
  Write-Host "== $m ==" -ForegroundColor Cyan
}

Clear-Host
Write-Host "============================================================" -ForegroundColor White
Write-Host "   撤销清理 - 恢复默认状态" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor White

# 1. 恢复服务
Head "1/5 恢复服务"
try { Set-Service -Name InstallService -StartupType Manual -ErrorAction Stop; Ok "InstallService -> Manual" } catch { Warn "InstallService: $($_.Exception.Message)" }
try { Set-Service -Name AppXSvc -StartupType Manual -ErrorAction Stop;     Ok "AppXSvc -> Manual" }      catch { Warn "AppXSvc: $($_.Exception.Message)" }
try { Start-Service AppXSvc -ErrorAction SilentlyContinue; Ok "AppXSvc 已启动" } catch {}

# 2. 重新启用计划任务
Head "2/5 重新启用 AppxDeployment 计划任务"
$enabledCount = 0
Get-ScheduledTask -ErrorAction SilentlyContinue |
  Where-Object { $_.TaskPath -like "*AppxDeploymentClient*" -or $_.TaskName -match "WSTask|Store" } |
  ForEach-Object {
    try {
      $_ | Enable-ScheduledTask -ErrorAction Stop | Out-Null
      $enabledCount++
      Ok "已启用: $($_.TaskPath)$($_.TaskName)"
    } catch {}
  }
if ($enabledCount -eq 0) { Ok "无相关计划任务" }

# 3. 删除我添加的注册表项
Head "3/5 删除脚本写入的注册表项"
$regRemove = @(
  "HKCU:\Software\Microsoft\Edge\EdgeShopping",
  "HKCU:\Software\Microsoft\Edge\PrivacyRecommendations",
  "HKCU:\Software\Policies\Microsoft\Edge\PWAInstallEnabled",
  "HKLM:\SOFTWARE\Policies\Microsoft\WindowsStore\AutoDownload",
  "HKLM:\SOFTWARE\Policies\Microsoft\WindowsStore\RemoveWindowsStore",
  "HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent\DisableWindowsConsumerFeatures"
)
foreach ($r in $regRemove) {
  if (Test-Path $r) {
    Remove-ItemProperty -Path (Split-Path $r -Parent) -Name (Split-Path $r -Leaf) -Force -ErrorAction SilentlyContinue
    Ok "已删除: $r"
  }
}

# 4. 把 ContentDeliveryManager 那些 "建议" 开关恢复默认
Head "4/5 恢复 ContentDeliveryManager 默认值"
$cdm = "HKCU:\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"
$cdmKeys = @(
  "SilentInstalledAppsEnabled",
  "SoftLandingEnabled",
  "SystemPaneSuggestionsEnabled",
  "SubscribedContent-338387Enabled",
  "SubscribedContent-338388Enabled",
  "SubscribedContent-338389Enabled",
  "SubscribedContent-353698Enabled"
)
foreach ($k in $cdmKeys) {
  if (Get-ItemProperty -Path $cdm -Name $k -ErrorAction SilentlyContinue) {
    Remove-ItemProperty -Path $cdm -Name $k -Force -ErrorAction SilentlyContinue
    Ok "已删除: $k"
  }
}

# 5. 恢复 Edge 首选项
Head "5/5 恢复 Edge 首选项 (如果之前被改过, 此处仅移除策略值)"
$edgePrefs = @(
  "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Preferences"
)
foreach ($p in $edgePrefs) {
  if (Test-Path $p) {
    $content = Get-Content $p -Raw -Encoding UTF8
    $before  = $content
    $content = $content -replace '"pwa_install_prompt_enabled":\s*false', '"pwa_install_prompt_enabled":true'
    $content = $content -replace '"web_app_install_prompt_enabled":\s*false', '"web_app_install_prompt_enabled":true'
    if ($content -ne $before) {
      [IO.File]::WriteAllText($p, $content, [Text.UTF8Encoding]::new($false))
      Ok "已恢复: $(Split-Path $p -Leaf)"
    } else { Ok "Edge 配置无需恢复" }
  }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  撤销完成! 请重启电脑" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
pause
