"""
Fetcher 抽象接口 —— 所有抓取器（Local + Apify）必须实现。
"""

from __future__ import annotations

import abc
from typing import Optional
from scraper.result import ProductResult, Source


class Fetcher(abc.ABC):
    """
    抓取器抽象基类。

    设计原则：
    - 输入 URL，输出 ProductResult
    - 内部自主处理反爬、限流、解析
    - 失败时返回 ProductResult(error=...) 而不是抛异常
    - 名字和 source 标识清楚
    """

    name: str = "abstract"
    source: Source = Source.LOCAL

    @abc.abstractmethod
    async def fetch(self, url: str, **kwargs) -> ProductResult:
        """
        抓取单个 URL 并返回结构化结果。

        Args:
            url: 目标商品 URL
            **kwargs: 平台特化参数（如 asin、locale 等）

        Returns:
            ProductResult：失败时 error 字段非空
        """
        raise NotImplementedError

    @abc.abstractmethod
    async def health_check(self) -> bool:
        """检查 fetcher 是否可用（依赖、凭据等）"""
        raise NotImplementedError

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} source={self.source.value}>"


class FetcherError(Exception):
    """抓取器错误基类"""

    def __init__(self, message: str, *, retryable: bool = False, cause: Optional[Exception] = None):
        super().__init__(message)
        self.retryable = retryable
        self.cause = cause
