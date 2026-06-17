#!/bin/bash
# 性能基线脚本
# 用法: bash scripts/perf-lighthouse.sh [url]
# 默认: http://localhost:3004

set -e
URL="${1:-http://localhost:3004}"
REPORT_DIR="docs/perf-baseline"
STAMP=$(date +%Y%m%d-%H%M%S)
REPORT="$REPORT_DIR/lighthouse-$STAMP.json"

mkdir -p "$REPORT_DIR"

echo "🔍 Lighthouse 性能测试: $URL"
echo "📄 报告: $REPORT"

# 检查 lighthouse 是否安装
if ! command -v lighthouse &> /dev/null; then
  echo "⚠️  lighthouse 未安装，跳过（生产环境使用: npm i -g lighthouse）"
  exit 0
fi

lighthouse "$URL" \
  --output=json \
  --output-path="$REPORT" \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance 2>/dev/null

if [ $? -eq 0 ]; then
  SCORE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$REPORT','utf-8')).categories.performance.score * 100)")
  echo "📊 性能评分: $SCORE / 100"
  if [ "$(echo "$SCORE < 80" | bc -l)" = "1" ]; then
    echo "❌ 性能不达标 (<80)"
    exit 1
  fi
  echo "✅ 性能达标"
else
  echo "❌ Lighthouse 失败"
  exit 1
fi
