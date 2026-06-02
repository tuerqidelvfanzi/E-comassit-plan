@echo off
chcp 65001 >/dev/null
title Microsoft Store Popup Fixer
color 0A

:: ============================================================
::  微软商店反复弹窗 - 一键清理 (双击本文件即可, 自动提权)
::  作者: Claude  ·  适配: Windows 10 / 11
:: ============================================================

cd /d "%~dp0"

:: 检查管理员权限, 没有就自动提权
net session >/dev/null 2>&1
if %errorLevel% neq 0 (
    echo [提权中] 正在请求管理员权限...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo ============================================================
echo    微软商店反复弹窗 - 一键清理工具
echo ============================================================
echo.
echo   本脚本将自动完成以下操作:
echo   1. 停止 Microsoft Store / Appx 部署服务
echo   2. 禁用 AppxDeployment 自动更新计划任务
echo   3. 清理 Microsoft Store 缓存 (wsreset)
echo   4. 清理 Appx 部署缓存
echo   5. 清理下载缓存中的 Store 安装包
echo   6. 关闭 Edge PWA 推送 / 商店推荐
echo   7. 关闭可能正在弹窗的进程
echo   8. 释放文件锁
echo   9. 检查前置条件
echo.
echo   完成后会自动重启电脑
echo.
echo ============================================================
echo.
pause

:: 临时绕过执行策略, 仅本进程生效
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-store-popup.ps1"

if %errorLevel% neq 0 (
    echo.
    echo [X] 脚本执行异常, 退出码: %errorLevel%
    echo     请查看同目录下的 fix-store-popup.log
    pause
)
