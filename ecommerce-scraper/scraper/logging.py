"""
统一日志 —— 所有模块共享。
"""

import sys
from loguru import logger

from scraper.config import settings


def setup_logging():
    """初始化 loguru，根据 settings 调整 level"""
    logger.remove()
    level = "DEBUG" if settings.debug else "INFO"
    logger.add(
        sys.stderr,
        level=level,
        format=(
            "<green>{time:HH:mm:ss.SSS}</green> | "
            "<level>{level: <7}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        ),
        colorize=True,
    )
    return logger


log = setup_logging()
