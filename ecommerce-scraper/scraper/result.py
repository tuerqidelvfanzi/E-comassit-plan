"""
Unified product data schema.

所有 fetcher（local + Apify）必须返回 ProductResult，保证对比可执行。
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import Any, Optional


class Source(str, Enum):
    """结果来源标识"""

    LOCAL = "local"                    # 本地引擎
    APIFY = "apify"                    # Apify 云端
    MANUAL = "manual"                  # 手动输入
    MERGED = "merged"                  # 多源合并


class StockStatus(str, Enum):
    """库存状态标准化"""

    IN_STOCK = "in_stock"
    OUT_OF_STOCK = "out_of_stock"
    LIMITED = "limited_stock"
    UNKNOWN = "unknown"


@dataclass
class ProductResult:
    """
    统一的商品数据结构。

    设计原则：
    - 字段语义对齐（不同平台"售价"统一为 price）
    - 缺失字段允许为 None（不强制完整）
    - raw 字段保留平台特有数据（不规范化）
    - source 标识来源（用于双轨对比）
    """

    # === 必填：身份与时间 ===
    url: str
    source: Source
    fetched_at: str  # ISO 8601
    result_id: str = ""  # url + source 的 md5（前 12 位）

    # === 商品核心字段（可空，缺失表示该来源没拿到）===
    title: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    stock: Optional[StockStatus] = None
    description: Optional[str] = None
    images: list[str] = field(default_factory=list)
    specs: dict[str, str] = field(default_factory=dict)  # key-value 规格

    # === 商家与评价 ===
    seller: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None

    # === 平台特定数据（不规范化）===
    raw: dict[str, Any] = field(default_factory=dict)

    # === 抓取元数据 ===
    confidence: float = 1.0  # fetcher 自评置信度 (0-1)
    fetch_method: str = ""  # "undetected-playwright" / "apify:xxx" 等
    fetch_duration_ms: int = 0
    error: Optional[str] = None  # 失败时记录

    def __post_init__(self):
        if not self.result_id:
            seed = f"{self.url}|{self.source.value}|{self.fetched_at}"
            self.result_id = hashlib.md5(seed.encode()).hexdigest()[:12]

    def to_dict(self) -> dict:
        d = asdict(self)
        d["source"] = self.source.value
        if self.stock is not None:
            d["stock"] = self.stock.value
        return d

    @property
    def is_complete(self) -> bool:
        """核心字段是否都拿到了（用于对比时的"缺口"判断）"""
        return all([
            self.title,
            self.price is not None,
            self.stock in (StockStatus.IN_STOCK, StockStatus.OUT_OF_STOCK, StockStatus.LIMITED),
        ])


# =============================================================================
# 对比结果
# =============================================================================

class ConflictSeverity(str, Enum):
    """冲突严重度"""

    EXACT = "exact"            # 完全一致
    MINOR = "minor"            # 小差异（如价格 ±1%）
    MAJOR = "major"            # 大差异（>5%）或一方缺失
    INCOMPARABLE = "incomparable"  # 数据不可比（如单位不同）


class ConflictResolution(str, Enum):
    """冲突解决策略"""

    USE_LOCAL = "use_local"
    USE_APIFY = "use_apify"
    USE_BOTH = "use_both"          # 保留差异记录
    NEEDS_REVIEW = "needs_review"  # 人工复核
    USE_AVG = "use_avg"            # 取平均（数值类）


@dataclass
class FieldConflict:
    """单个字段的对比结果"""

    field: str
    local_value: Any
    apify_value: Any
    severity: ConflictSeverity
    similarity: float  # 0-1
    resolution: ConflictResolution
    note: str = ""  # 解释

    def to_dict(self) -> dict:
        return {
            "field": self.field,
            "local": self.local_value,
            "apify": self.apify_value,
            "severity": self.severity.value,
            "similarity": self.similarity,
            "resolution": self.resolution.value,
            "note": self.note,
        }


@dataclass
class ComparisonResult:
    """双源对比结果"""

    agreement_score: float  # 0-1 综合一致度
    conflicts: list[FieldConflict] = field(default_factory=list)
    recommended: Optional[ProductResult] = None  # 综合推荐结果
    drift_detected: bool = False  # 是否检测到本地引擎漂移
    drift_severity: str = "none"  # none | minor | major | critical

    # 元数据
    compared_at: str = ""
    local_source: str = ""
    apify_source: str = ""

    def __post_init__(self):
        if not self.compared_at:
            self.compared_at = datetime.utcnow().isoformat()

    @property
    def is_healthy(self) -> bool:
        return self.agreement_score >= 0.85 and not self.drift_detected

    @property
    def needs_attention(self) -> bool:
        return self.agreement_score < 0.7 or self.drift_severity in ("major", "critical")

    def to_dict(self) -> dict:
        return {
            "agreement_score": self.agreement_score,
            "drift_detected": self.drift_detected,
            "drift_severity": self.drift_severity,
            "is_healthy": self.is_healthy,
            "needs_attention": self.needs_attention,
            "compared_at": self.compared_at,
            "local_source": self.local_source,
            "apify_source": self.apify_source,
            "conflicts": [c.to_dict() for c in self.conflicts],
            "recommended": self.recommended.to_dict() if self.recommended else None,
        }


@dataclass
class DualScrapeResult:
    """双轨抓取总结果"""

    url: str
    local: Optional[ProductResult] = None
    apify: Optional[ProductResult] = None
    comparison: Optional[ComparisonResult] = None

    # 执行元数据
    total_duration_ms: int = 0
    success: bool = False
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "success": self.success,
            "total_duration_ms": self.total_duration_ms,
            "error": self.error,
            "local": self.local.to_dict() if self.local else None,
            "apify": self.apify.to_dict() if self.apify else None,
            "comparison": self.comparison.to_dict() if self.comparison else None,
        }
