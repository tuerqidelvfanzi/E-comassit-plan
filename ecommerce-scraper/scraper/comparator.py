"""
对比引擎 —— Local vs Apify 字段级 diff + 漂移检测 + 自动校正建议。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from thefuzz import fuzz

from scraper.config import settings
from scraper.logging import log
from scraper.result import (
    ComparisonResult,
    ConflictResolution,
    ConflictSeverity,
    FieldConflict,
    ProductResult,
    StockStatus,
)


class Comparator:
    """
    字段级对比器。

    能力：
    - 数值类（价格）：容差比较
    - 文本类（标题）：语义相似度
    - 枚举类（库存）：严格匹配
    - 缺失检测（一边有，一边没有）
    - 漂移告警（连续 N 次低 agreement）

    不做的事：
    - 不主动改写 fetcher 逻辑
    - 不直接落盘（由 orchestrator 决定）
    - 不抓取数据
    """

    # 文本相似度阈值
    TEXT_EXACT = 95
    TEXT_MINOR = 80
    # 数值容差（百分比）
    NUMERIC_MINOR_PCT = 0.05  # 5%
    NUMERIC_MAJOR_PCT = 0.20  # 20%

    def compare(
        self,
        local: ProductResult,
        apify: ProductResult,
    ) -> ComparisonResult:
        """
        对比两份 ProductResult，返回 ComparisonResult。
        """
        if not local or not apify:
            raise ValueError("Both local and apify results must be provided")

        conflicts: list[FieldConflict] = []
        # 构造推荐结果（用 Apify 作 base，本地补全）
        recommended = self._merge_recommended(local, apify)

        # === 字段级对比 ===
        # 1. 标题
        conflicts.append(self._compare_text("title", local.title, apify.title))
        # 2. 价格（最关键）
        conflicts.append(self._compare_price(local.price, apify.price, local.currency, apify.currency))
        # 3. 库存
        conflicts.append(self._compare_stock(local.stock, apify.stock))
        # 4. 卖家
        conflicts.append(self._compare_text("seller", local.seller, apify.seller))
        # 5. 评分
        conflicts.append(self._compare_rating(local.rating, apify.rating))
        # 6. 评论数
        conflicts.append(self._compare_int("review_count", local.review_count, apify.review_count))
        # 7. 描述长度（启发式）
        conflicts.append(self._compare_text_length("description", local.description, apify.description))
        # 8. 图片数量
        conflicts.append(self._compare_int("image_count", len(local.images), len(apify.images)))

        # === 计算综合一致度 ===
        score = self._compute_agreement(conflicts)

        # === 漂移检测 ===
        drift_detected, drift_severity = self._detect_drift(score, conflicts)

        result = ComparisonResult(
            agreement_score=score,
            conflicts=conflicts,
            recommended=recommended,
            drift_detected=drift_detected,
            drift_severity=drift_severity,
            local_source=local.fetch_method or local.source.value,
            apify_source=apify.fetch_method or apify.source.value,
        )

        log.info(
            f"🔍 Compared local vs apify | "
            f"agreement={score:.2%} | drift={drift_severity} | "
            f"conflicts={len([c for c in conflicts if c.severity != ConflictSeverity.EXACT])}"
        )
        return result

    # =================================================================
    # 字段级对比方法
    # =================================================================

    def _compare_text(self, field: str, local: Optional[str], apify: Optional[str]) -> FieldConflict:
        """文本字段对比"""
        if local is None and apify is None:
            return FieldConflict(field, local, apify, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH, "both missing")
        if local is None:
            return FieldConflict(field, local, apify, ConflictSeverity.MAJOR, 0.0, ConflictResolution.USE_APIFY, "local missing")
        if apify is None:
            return FieldConflict(field, local, apify, ConflictSeverity.MAJOR, 0.0, ConflictResolution.USE_LOCAL, "apify missing")

        sim = fuzz.token_set_ratio(local, apify) / 100.0
        if sim >= self.TEXT_EXACT / 100:
            return FieldConflict(field, local, apify, ConflictSeverity.EXACT, sim, ConflictResolution.USE_BOTH)
        if sim >= self.TEXT_MINOR / 100:
            return FieldConflict(field, local, apify, ConflictSeverity.MINOR, sim, ConflictResolution.USE_APIFY, "prefer apify as canonical")
        return FieldConflict(field, local, apify, ConflictSeverity.MAJOR, sim, ConflictResolution.NEEDS_REVIEW, "low text similarity")

    def _compare_price(
        self,
        local: Optional[float],
        apify: Optional[float],
        local_cur: Optional[str],
        apify_cur: Optional[str],
    ) -> FieldConflict:
        """价格对比（最核心）"""
        # 货币不一致 → 不可比
        if local_cur and apify_cur and local_cur != apify_cur:
            return FieldConflict(
                "price", local, apify, ConflictSeverity.INCOMPARABLE, 0.0,
                ConflictResolution.NEEDS_REVIEW, f"currency mismatch: {local_cur} vs {apify_cur}",
            )
        # 缺失
        if local is None and apify is None:
            return FieldConflict("price", local, apify, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH, "both missing")
        if local is None:
            return FieldConflict("price", local, apify, ConflictSeverity.MAJOR, 0.0, ConflictResolution.USE_APIFY, "local missing")
        if apify is None:
            return FieldConflict("price", local, apify, ConflictSeverity.MAJOR, 0.0, ConflictResolution.USE_LOCAL, "apify missing")

        # 数值比较
        if apify == 0:
            pct = 1.0 if local != 0 else 0.0
        else:
            pct = abs(local - apify) / abs(apify)

        if pct == 0:
            return FieldConflict("price", local, apify, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH)
        if pct < self.NUMERIC_MINOR_PCT:
            return FieldConflict("price", local, apify, ConflictSeverity.MINOR, 1.0 - pct, ConflictResolution.USE_APIFY, f"diff={pct:.1%} < 5%")
        if pct < self.NUMERIC_MAJOR_PCT:
            return FieldConflict("price", local, apify, ConflictSeverity.MAJOR, 1.0 - pct, ConflictResolution.NEEDS_REVIEW, f"diff={pct:.1%}")
        return FieldConflict("price", local, apify, ConflictSeverity.MAJOR, 1.0 - pct, ConflictResolution.NEEDS_REVIEW, f"diff={pct:.1%} - investigate")

    def _compare_stock(
        self,
        local: Optional[StockStatus],
        apify: Optional[StockStatus],
    ) -> FieldConflict:
        if local is None and apify is None:
            return FieldConflict("stock", local, apify, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH, "both unknown")
        if local is None:
            return FieldConflict("stock", local, apify, ConflictSeverity.MINOR, 0.5, ConflictResolution.USE_APIFY, "local unknown")
        if apify is None:
            return FieldConflict("stock", local, apify, ConflictSeverity.MINOR, 0.5, ConflictResolution.USE_LOCAL, "apify unknown")
        if local == apify:
            return FieldConflict("stock", local.value, apify.value, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH)
        return FieldConflict("stock", local.value, apify.value, ConflictSeverity.MAJOR, 0.0, ConflictResolution.NEEDS_REVIEW, "stock status conflict")

    def _compare_rating(
        self,
        local: Optional[float],
        apify: Optional[float],
    ) -> FieldConflict:
        if local is None and apify is None:
            return FieldConflict("rating", local, apify, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH, "both missing")
        if local is None:
            return FieldConflict("rating", local, apify, ConflictSeverity.MINOR, 0.5, ConflictResolution.USE_APIFY)
        if apify is None:
            return FieldConflict("rating", local, apify, ConflictSeverity.MINOR, 0.5, ConflictResolution.USE_LOCAL)
        diff = abs(local - apify)
        if diff < 0.1:
            return FieldConflict("rating", local, apify, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH)
        if diff < 0.5:
            return FieldConflict("rating", local, apify, ConflictSeverity.MINOR, 1.0 - diff, ConflictResolution.USE_APIFY)
        return FieldConflict("rating", local, apify, ConflictSeverity.MAJOR, 1.0 - diff, ConflictResolution.NEEDS_REVIEW)

    def _compare_int(self, field: str, local: Optional[int], apify: Optional[int]) -> FieldConflict:
        if local is None and apify is None:
            return FieldConflict(field, local, apify, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH)
        if local is None:
            return FieldConflict(field, local, apify, ConflictSeverity.MINOR, 0.5, ConflictResolution.USE_APIFY)
        if apify is None:
            return FieldConflict(field, local, apify, ConflictSeverity.MINOR, 0.5, ConflictResolution.USE_LOCAL)
        if local == apify:
            return FieldConflict(field, local, apify, ConflictSeverity.EXACT, 1.0, ConflictResolution.USE_BOTH)
        diff_pct = abs(local - apify) / max(local, apify, 1)
        if diff_pct < 0.1:
            return FieldConflict(field, local, apify, ConflictSeverity.MINOR, 1.0 - diff_pct, ConflictResolution.USE_APIFY)
        return FieldConflict(field, local, apify, ConflictSeverity.MAJOR, 1.0 - diff_pct, ConflictResolution.NEEDS_REVIEW)

    def _compare_text_length(self, field: str, local: Optional[str], apify: Optional[str]) -> FieldConflict:
        """描述长度对比（启发式：通常不应差距太大）"""
        l_len = len(local) if local else 0
        a_len = len(apify) if apify else 0
        # 复用 _compare_int
        return self._compare_int(f"{field}_len", l_len, a_len)

    # =================================================================
    # 综合一致度 + 漂移检测
    # =================================================================

    def _compute_agreement(self, conflicts: list[FieldConflict]) -> float:
        """加权平均 similarity（关键字段权重高）"""
        weights = {
            "title": 2.0,
            "price": 3.0,  # 价格最重要
            "stock": 1.5,
            "seller": 1.0,
            "rating": 1.0,
            "review_count": 0.5,
            "description_len": 0.5,
            "image_count": 0.5,
        }
        total_w, sum_sim = 0.0, 0.0
        for c in conflicts:
            # INCOMPARABLE 不计入分母
            if c.severity == ConflictSeverity.INCOMPARABLE:
                continue
            w = weights.get(c.field, 1.0)
            total_w += w
            sum_sim += c.similarity * w
        return sum_sim / total_w if total_w > 0 else 0.0

    def _detect_drift(self, score: float, conflicts: list[FieldConflict]) -> tuple[bool, str]:
        """
        漂移检测：本地引擎可能因为目标站改版而失效。
        """
        if score < 0.5:
            return True, "critical"
        if score < settings.agreement_threshold_alert:
            return True, "major"
        if score < settings.agreement_threshold_warn:
            return True, "minor"
        # 价格大差异也算漂移信号
        price_conflict = next((c for c in conflicts if c.field == "price"), None)
        if price_conflict and price_conflict.severity == ConflictSeverity.MAJOR:
            return True, "major"
        return False, "none"

    def _merge_recommended(self, local: ProductResult, apify: ProductResult) -> ProductResult:
        """
        构造推荐结果：以 Apify 为 base，本地补全缺失字段。
        """
        base = apify  # Apify 通常更准确
        return ProductResult(
            url=apify.url,
            source=apify.source,  # 推荐结果归属 Apify
            fetched_at=apify.fetched_at,
            title=base.title or local.title,
            price=base.price if base.price is not None else local.price,
            currency=base.currency or local.currency,
            stock=base.stock or local.stock,
            description=base.description or local.description,
            images=base.images if len(base.images) >= len(local.images) else local.images,
            specs={**local.specs, **base.specs},  # base 优先
            seller=base.seller or local.seller,
            rating=base.rating if base.rating is not None else local.rating,
            review_count=base.review_count if base.review_count is not None else local.review_count,
            raw={"merged_from": ["local", "apify"], "apify_raw": apify.raw, "local_raw": local.raw},
            confidence=min(local.confidence, apify.confidence) or 1.0,
            fetch_method=f"merged:local({local.fetch_method})+apify({apify.fetch_method})",
        )
