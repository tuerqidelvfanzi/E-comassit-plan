@echo off
REM 代理通过外部环境变量提供（HTTP_PROXY / HTTPS_PROXY），不硬编码
REM NotebookLM CLI 路径通过 NOTEBOOKLM_CLI 环境变量提供
python "%~dp0lazygit.py" %*
