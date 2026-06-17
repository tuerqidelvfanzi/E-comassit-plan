"""
全局配置 —— 单一来源，所有 fetcher 共享。
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """全局配置（自动从 .env 读取）"""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # === Apify ===
    apify_token: Optional[str] = Field(default=None, alias="APIFY_TOKEN")
    apify_max_charge_usd: float = Field(default=10.0, alias="APIFY_MAX_CHARGE_USD")

    # === LLM (可选) ===
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")

    # === 代理 ===
    proxy_url: Optional[str] = Field(default=None, alias="PROXY_URL")
    # 格式: "http://user:pass@host:port" 或 Bright Data 的 provider URL
    # 留空则直连

    # === 限流 ===
    rate_limit_per_min: int = Field(default=20, alias="RATE_LIMIT_PER_MIN")
    rate_limit_jitter: float = Field(default=0.5, alias="RATE_LIMIT_JITTER")

    # === 对比阈值 ===
    agreement_threshold_warn: float = Field(default=0.85, alias="AGREEMENT_THRESHOLD_WARN")
    agreement_threshold_alert: float = Field(default=0.70, alias="AGREEMENT_THRESHOLD_ALERT")
    price_tolerance_pct: float = Field(default=0.05, alias="PRICE_TOLERANCE_PCT")

    # === 存储 ===
    db_path: str = Field(default="data/scraper.db", alias="DB_PATH")
    divergence_log_dir: str = Field(default="data/divergences", alias="DIVERGENCE_LOG_DIR")

    # === 行为模拟 ===
    mouse_move_min_ms: int = Field(default=200, alias="MOUSE_MOVE_MIN_MS")
    mouse_move_max_ms: int = Field(default=800, alias="MOUSE_MOVE_MAX_MS")
    scroll_pause_min_ms: int = Field(default=500, alias="SCROLL_PAUSE_MIN_MS")
    scroll_pause_max_ms: int = Field(default=1500, alias="SCROLL_PAUSE_MAX_MS")

    # === 调试 ===
    debug: bool = Field(default=False, alias="DEBUG")
    save_raw_html: bool = Field(default=False, alias="SAVE_RAW_HTML")


# 全局单例
settings = Settings()


def reload_settings() -> Settings:
    """重新加载配置（用于 .env 改变后）"""
    global settings
    settings = Settings()
    return settings
