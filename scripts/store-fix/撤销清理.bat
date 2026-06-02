@echo off
chcp 65001 >/dev/null
title Undo Store Popup Fixer
color 0E

:: ============================================================
::  撤销清理 - 恢复 Microsoft Store 默认状态
:: ============================================================

cd /d "%~dp0"

net session >/dev/null 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo ============================================================
echo    撤销清理 - 恢复 Microsoft Store 默认状态
echo ============================================================
echo.
echo   本脚本会:
echo   - 恢复 InstallService / AppXSvc 服务为 Manual
echo   - 重新启用 AppxDeployment 计划任务
echo   - 删除脚本写入的注册表项
echo   - 恢复 Edge PWA 推送默认值
echo.
pause

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-store-popup-undo.ps1"
