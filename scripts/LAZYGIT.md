# LazyGit - 节俭同步

## 概念

```
本地开发 ──────→ 云端备份
                  ↑
             按需拉取
             （非必要不拉）
```

## 解决的问题

- 外出时用云端（手机/平板）
- 开发时用本地（IDE）
- 两边资料不同步的焦虑

## 同步逻辑

| 状态 | 含义 |
|------|------|
| ✅ | 两边数量一致，无需操作 |
| 📥 | 云端有新内容，可拉取 |
| 📤 | 本地有新内容，在云端上传 |

## 命令

```bash
# 进入项目目录（请将 <repo_root> 替换为你的本地仓库路径）
cd <repo_root>

# 检查同步状态
python scripts/lazygit.py

# 初始化笔记本（首次）
python scripts/lazygit.py init <笔记本ID前8位>

# 拉取云端内容（按需）
python scripts/lazygit.py pull
```

或者用批处理：
```cmd
scripts\lazygit.bat
scripts\lazygit.bat init <笔记本ID前8位>
```

## 状态文件

`scripts/lazygit-state.json` 记录已同步的笔记本（**已在 .gitignore 忽略**）：

```json
{
  "notebooks": {
    "<笔记本ID>": {
      "title": "跨境电商AI助手",
      "count": 24,
      "date": "2026-06-01T16:30:00"
    }
  },
  "last": "2026-06-01T16:30:00"
}
```

## 流程

```
1. 启动开发环境
2. 运行 lazylazy 检查状态
3. 发现 📥 → 决定是否拉取
4. 本地写完 → 在云端上传
5. 继续工作
```

## 注意

- 需要开启 VPN
- 视频外链只记录引用，不下载
- 大文件建议直接存网盘，文档放本地
