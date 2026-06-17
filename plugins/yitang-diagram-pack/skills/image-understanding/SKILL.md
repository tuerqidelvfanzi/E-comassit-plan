---
name: image-understanding
description: "图片理解工具。当用户提供图片文件（PNG/JPG/GIF/WebP等）时，必须使用此skill调用MiniMax API进行图像理解和文字提取。支持本地图片路径或URL。"
allowed-tools: Read,Write,Edit,Bash
---

# 图片理解工具 (Image Understanding)

## 使用场景

当用户提供图片文件并要求：
- 提取图片中的文字内容
- 描述图片内容
- 分析图片信息
- 读取截图、PPT、文档图片等

**必须使用此skill**，不要尝试其他方式。

## API端点

```
POST https://api.minimaxi.com/v1/coding_plan/vlm
```

## Python调用示例

```python
import requests
import base64
import os

# 读取图片并转为Data URL
image_path = "图片路径"  # 支持绝对路径或相对路径
with open(image_path, "rb") as f:
    img_base64 = base64.b64encode(f.read()).decode('utf-8')
data_url = f"data:image/png;base64,{img_base64}"

# API调用
url = "https://api.minimaxi.com/v1/coding_plan/vlm"
headers = {
    "Authorization": f"Bearer {os.environ.get('MINIMAX_API_KEY')}",
    "Content-Type": "application/json"
}
payload = {
    "prompt": "请完整提取这张图片中的所有文字内容",
    "image_url": data_url
}
response = requests.post(url, headers=headers, json=payload, timeout=120)
result = response.json()
print(result.get('content', ''))
```

## 支持的图片格式

- PNG
- JPEG/JPG
- GIF
- WebP
- 最大 20MB

## 重要提示

1. **必须使用正确的API端点**: `https://api.minimaxi.com/v1/coding_plan/vlm`
2. **不要使用** `/anthropic/v1/messages` 端点，该端点不支持图片
3. **图片需要转为Data URL格式**: `data:image/png;base64,{base64数据}`
4. **API Key从环境变量读取**: `os.environ.get('MINIMAX_API_KEY')`

## 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 400错误 | 图片URL格式错误 | 确保使用Data URL格式 |
| 404错误 | API端点错误 | 使用 `/v1/coding_plan/vlm` |
| 读取失败 | 文件路径错误 | 使用绝对路径 |

## 执行步骤

1. 获取图片文件路径
2. 读取图片并转为base64
3. 构建Data URL
4. 调用MiniMax VLM API
5. 返回图片中的文字/内容
