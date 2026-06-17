#!/bin/bash
# Unix/Linux/Mac 一键安装脚本
set -e

echo "========================================"
echo "  ecommerce-scraper 安装脚本"
echo "========================================"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到 python3，请先安装 Python 3.10+"
    exit 1
fi

echo "[1/4] 创建虚拟环境..."
python3 -m venv .venv

echo "[2/4] 激活虚拟环境..."
source .venv/bin/activate

echo "[3/4] 安装依赖..."
pip install --upgrade pip
pip install -e ".[all]"

echo "[4/4] 安装 Playwright 浏览器..."
playwright install chromium

echo ""
echo "========================================"
echo "  安装完成！"
echo "========================================"
echo ""
echo "下一步:"
echo "  1. 复制 .env.example 为 .env 并填入凭据"
echo "     cp .env.example .env"
echo ""
echo "  2. 跑 quickstart 演示"
echo "     python quickstart.py"
echo ""
echo "  3. 跑测试验证"
echo "     pytest tests/ -v"
echo ""
echo "  4. CLI 试用"
echo "     escrape --help"
