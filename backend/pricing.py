"""
Project-level pricing catalog and Stripe config helpers.
"""
import os
from typing import Any, Dict

from models import PlanCode, ProjectEntitlementSummary


PLAN_CATALOG: Dict[PlanCode, Dict[str, Any]] = {
    "free": {
        "label": "Free",
        "screenshot_hd_export_enabled": False,
        "screenshot_export_enabled": True,
        "screenshot_multiversion_enabled": False,
        "screenshot_multilingual_enabled": False,
        "policy_publish_enabled": False,
        "policy_multilingual_enabled": False,
        "policy_hosting_enabled": False,
        "ai_quota_total": None,
    },
    "base": {
        "label": "Base",
        "screenshot_hd_export_enabled": True,
        "screenshot_export_enabled": True,
        "screenshot_multiversion_enabled": False,
        "screenshot_multilingual_enabled": False,
        "policy_publish_enabled": True,
        "policy_multilingual_enabled": False,
        "policy_hosting_enabled": True,
        "ai_quota_total": 100,
    },
    "pro": {
        "label": "Pro",
        "screenshot_hd_export_enabled": True,
        "screenshot_export_enabled": True,
        "screenshot_multiversion_enabled": True,
        "screenshot_multilingual_enabled": True,
        "policy_publish_enabled": True,
        "policy_multilingual_enabled": True,
        "policy_hosting_enabled": True,
        "ai_quota_total": None,
    },
}


def build_entitlement_payload(plan_code: PlanCode, *, status: str = "active", ai_quota_used: int = 0) -> Dict[str, Any]:
    """Build persisted entitlement fields from the pricing catalog."""
    catalog = PLAN_CATALOG[plan_code]
    return {
        "plan_code": plan_code,
        "status": status,
        "ai_quota_total": catalog["ai_quota_total"],
        "ai_quota_used": ai_quota_used,
    }


def summarize_entitlement(entitlement: Any) -> ProjectEntitlementSummary:
    """Convert a stored entitlement to frontend summary shape."""
    ai_quota_total = getattr(entitlement, "ai_quota_total", None)
    ai_quota_used = getattr(entitlement, "ai_quota_used", 0) or 0
    ai_quota_remaining = None if ai_quota_total is None else max(0, ai_quota_total - ai_quota_used)
    plan_code = getattr(entitlement, "plan_code", "free")
    catalog = PLAN_CATALOG.get(plan_code, PLAN_CATALOG["free"])

    return ProjectEntitlementSummary(
        plan_code=plan_code,
        status=getattr(entitlement, "status", "inactive"),
        screenshot_hd_export_enabled=catalog["screenshot_hd_export_enabled"],
        screenshot_export_enabled=catalog["screenshot_export_enabled"],
        screenshot_multiversion_enabled=catalog["screenshot_multiversion_enabled"],
        screenshot_multilingual_enabled=catalog["screenshot_multilingual_enabled"],
        policy_publish_enabled=catalog["policy_publish_enabled"],
        policy_multilingual_enabled=catalog["policy_multilingual_enabled"],
        policy_hosting_enabled=catalog["policy_hosting_enabled"],
        ai_quota_total=ai_quota_total,
        ai_quota_used=ai_quota_used,
        ai_quota_remaining=ai_quota_remaining,
        can_upgrade_to_base=plan_code == "free",
        can_upgrade_to_pro=plan_code in {"free", "base"},
    )


def get_stripe_price_id(plan_code: PlanCode) -> str | None:
    """Resolve Stripe price ID for a paid plan from env."""
    if plan_code == "base":
        return os.getenv("STRIPE_PRICE_ID_BASE")
    if plan_code == "pro":
        return os.getenv("STRIPE_PRICE_ID_PRO")
    return None


def get_site_url() -> str:
    """Resolve public site origin for redirect URLs."""
    return os.getenv("PUBLIC_SITE_URL") or "http://localhost:3003"
