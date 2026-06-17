# Minimax API 测试工具

## 测试结果 (2026-05-29) - 13/13 通过

| # | 功能 | 端点 | 状态 | 说明 |
|---|------|------|------|------|
| 1 | 列出模型 | `GET /v1/models` | ✅ | 7 个模型可用 |
| 2 | Anthropic 格式 | `POST /anthropic/v1/messages` | ✅ | **注意路径是 `/anthropic/v1/...`** |
| 3 | OpenAI 格式 | `POST /v1/chat/completions` | ✅ | 兼容格式 |
| 4 | 流式输出 | `POST /v1/chat/completions` (stream) | ✅ | SSE 分块传输 |
| 5 | 图像理解 | `POST /v1/chat/completions` (vision) | ✅ | 支持 base64/URL 图片 |
| 6 | 音乐生成 | `POST /v1/music_generation` | ✅ | music-2.0 模型 |
| 7 | 向量嵌入 | `POST /v1/embeddings` | ✅ | embo-01 模型 |
| 8 | 多轮对话 | `POST /v1/chat/completions` | ✅ | 支持对话历史 |
| 9 | 系统提示词 | `POST /v1/chat/completions` | ✅ | system role |
| 10 | Function Calling | `POST /v1/chat/completions` | ✅ | 支持 tools |
| 11 | Usage 信息 | 响应体 | ✅ | 返回 token 统计 |
| 12 | 参数设置 | temperature, top_p, stop | ✅ | 生成参数 |
| 13 | JSON Mode | response_format | ✅ | JSON 对象输出 |

**重要发现**: Anthropic 格式的正确路径是 `/anthropic/v1/messages`，而不是 `/v1/messages`！

## 快速测试

### 1. 设置环境变量

```bash
# Windows PowerShell
$env:MINIMAX_API_KEY = "your_api_key_here"
$env:MINIMAX_API_BASE = "https://api.minimaxi.com"

# macOS / Linux
export MINIMAX_API_KEY="your_api_key_here"
export MINIMAX_API_BASE="https://api.minimaxi.com"
```

### 2. 运行 Python 测试脚本

```bash
python d:/07-开发/12-skill/test_mcp_all.py
```

### 3. curl 快速测试

```bash
# 测试连接
curl -X GET "https://api.minimaxi.com/v1/models" \
  -H "Authorization: Bearer $MINIMAX_API_KEY"

# 测试 Anthropic 格式 (正确路径!)
curl -X POST "https://api.minimaxi.com/anthropic/v1/messages" \
  -H "x-api-key: $MINIMAX_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"MiniMax-M2.7-highspeed","messages":[{"role":"user","content":"reply OK"}],"max_tokens":10}'

# 测试 OpenAI 格式
curl -X POST "https://api.minimaxi.com/v1/chat/completions" \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"MiniMax-M2.7-highspeed","messages":[{"role":"user","content":"reply OK"}],"max_tokens":10}'

# 测试流式输出
curl -N -X POST "https://api.minimaxi.com/v1/chat/completions" \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"MiniMax-M2.7-highspeed","messages":[{"role":"user","content":"count to 3"}],"stream":true}'
```

## API 端点速查

| 功能 | 端点 | 认证方式 |
|------|------|----------|
| 列出模型 | `GET /v1/models` | Bearer Token |
| Anthropic 格式 | `POST /anthropic/v1/messages` | x-api-key header |
| OpenAI 格式 | `POST /v1/chat/completions` | Bearer Token |
| 音乐生成 | `POST /v1/music_generation` | Bearer Token |
| 向量嵌入 | `POST /v1/embeddings` | Bearer Token |

## 在 Claude Code 中测试

> "请用中文简单介绍一下自己"

如果能正常回复，说明 MCP 配置正确！
