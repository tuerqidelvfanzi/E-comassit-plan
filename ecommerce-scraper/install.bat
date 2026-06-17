@echo off
REM Windows 一键安装脚本
chcp 65001 > nul

echo ========================================
echo   ecommerce-scraper 安装脚本
echo ========================================
echo.

REM 检查 Python
python --version > nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 python，请先安装 Python 3.10+
    exit /b 1
)

echo [1/4] 创建虚拟环境...
python -m venv .venv
if errorlevel 1 (
    echo [错误] 创建虚拟环境失败
    exit /b 1
)

echo [2/4] 激活虚拟环境...
call .venv\Scripts\activate.bat

echo [3/4] 安装依赖...
pip install --upgrade pip
pip install -e ".[all]"
if errorlevel 1 (
    echo [错误] 依赖安装失败
    exit /b 1
)

echo [4/4] 安装 Playwright 浏览器...
playwright install chromium

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 下一步:
echo   1. 复制 .env.example 为 .env 并填入凭据
echo      copy .env.example .env
echo.
echo   2. 跑 quickstart 演示
echo      python quickstart.py
echo.
echo   3. 跑测试验证
echo      pytest tests/ -v
echo.
echo   4. CLI 试用
echo      escrape --help
echo.
pause
