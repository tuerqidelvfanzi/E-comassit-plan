"""ecommerce-scraper: dual-path e-commerce scraper with auto-comparison."""

from scraper.result import ProductResult, ComparisonResult, DualScrapeResult, FieldConflict
from scraper.orchestrator import scrape, scrape_batch
from scraper.comparator import Comparator

__version__ = "0.1.0"

__all__ = [
    "ProductResult",
    "ComparisonResult",
    "DualScrapeResult",
    "FieldConflict",
    "scrape",
    "scrape_batch",
    "Comparator",
]
