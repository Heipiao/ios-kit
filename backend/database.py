"""
Database client for Supabase
"""
import os
from supabase import create_client, Client
from typing import Optional, List, Dict, Any

from models import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    AssetCreate,
    AssetResponse,
    ScreenshotConfigCreate,
    ScreenshotConfigResponse,
    PolicySiteCreate,
    PolicySiteResponse,
    ProjectEntitlementCreate,
    ProjectEntitlementResponse,
    PaymentOrderCreate,
    PaymentOrderResponse,
    AiUsageEventCreate,
    AiUsageEventResponse,
)
from pricing import build_entitlement_payload


class DatabaseClient:
    """Supabase database client"""

    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY must be set")

        self.client: Client = create_client(supabase_url, supabase_key)

    # ==================== Projects ====================

    async def get_projects(self) -> List[ProjectResponse]:
        """Get all projects"""
        result = self.client.table("projects").select("*").order("created_at", desc=True).execute()
        return [ProjectResponse(**project) for project in result.data]

    async def get_project(self, project_id: str) -> Optional[ProjectResponse]:
        """Get a single project by ID"""
        result = self.client.table("projects").select("*").eq("id", project_id).execute()
        if result.data and len(result.data) > 0:
            return ProjectResponse(**result.data[0])
        return None

    async def create_project(self, data: ProjectCreate) -> ProjectResponse:
        """Create a new project"""
        project_data = {
            "name": data.name,
            "description": data.description or "",
            "device_type": data.device_type,
        }
        result = self.client.table("projects").insert(project_data).execute()
        return ProjectResponse(**result.data[0])

    async def update_project(self, project_id: str, data: ProjectUpdate) -> Optional[ProjectResponse]:
        """Update an existing project"""
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_data:
            return await self.get_project(project_id)

        result = self.client.table("projects").update(update_data).eq("id", project_id).execute()
        if result.data and len(result.data) > 0:
            return ProjectResponse(**result.data[0])
        return None

    async def delete_project(self, project_id: str) -> bool:
        """Delete a project"""
        result = self.client.table("projects").delete().eq("id", project_id).execute()
        return len(result.data) > 0

    # ==================== Assets ====================

    async def get_assets(self, project_id: Optional[str] = None) -> List[AssetResponse]:
        """Get assets, optionally filtered by project"""
        query = self.client.table("assets").select("*")
        if project_id:
            query = query.eq("project_id", project_id)
        result = query.order("created_at", desc=True).execute()
        return [AssetResponse(**asset) for asset in result.data]

    async def get_asset(self, asset_id: str) -> Optional[AssetResponse]:
        """Get a single asset by ID"""
        result = self.client.table("assets").select("*").eq("id", asset_id).execute()
        if result.data and len(result.data) > 0:
            return AssetResponse(**result.data[0])
        return None

    async def create_asset(self, data: AssetCreate) -> AssetResponse:
        """Create a new asset"""
        asset_data = {
            "project_id": data.project_id,
            "type": data.type,
            "storage_path": data.storage_path,
            "storage_url": data.storage_url,
            "filename": data.filename,
            "mime_type": data.mime_type,
            "width": data.width,
            "height": data.height,
            "file_size": data.file_size,
        }
        result = self.client.table("assets").insert(asset_data).execute()
        return AssetResponse(**result.data[0])

    async def update_asset(self, asset_id: str, data: Dict[str, Any]) -> Optional[AssetResponse]:
        """Update an existing asset"""
        result = self.client.table("assets").update(data).eq("id", asset_id).execute()
        if result.data and len(result.data) > 0:
            return AssetResponse(**result.data[0])
        return None

    async def delete_asset(self, asset_id: str) -> bool:
        """Delete an asset"""
        result = self.client.table("assets").delete().eq("id", asset_id).execute()
        return len(result.data) > 0

    # ==================== Screenshot Configs ====================

    async def get_screenshot_config(
        self,
        project_id: str,
        version: Optional[str] = None,
    ) -> Optional[ScreenshotConfigResponse]:
        """Get screenshot config, optionally by version"""
        query = self.client.table("screenshot_configs").select("*").eq("project_id", project_id)
        if version:
            query = query.eq("version", version)

        result = query.order("created_at", desc=True).limit(1).execute()
        if result.data and len(result.data) > 0:
            return ScreenshotConfigResponse(**result.data[0])
        return None

    async def get_screenshot_configs(
        self,
        project_id: str,
    ) -> Dict[str, ScreenshotConfigResponse]:
        """Get all screenshot configs for a project (both versions)"""
        result = self.client.table("screenshot_configs").select("*").eq("project_id", project_id).execute()

        configs = {}
        for config in result.data:
            configs[config["version"]] = ScreenshotConfigResponse(**config)
        return configs

    async def save_screenshot_config(
        self,
        project_id: str,
        data: ScreenshotConfigCreate,
    ) -> ScreenshotConfigResponse:
        """Save a screenshot config (upsert by version)"""
        # Check if config exists for this version
        existing = await self.get_screenshot_config(project_id, data.version)

        config_data = {
            "project_id": project_id,
            "version": data.version,
            "config": data.config,
            "exported_png_urls": data.exported_png_urls or [],
        }

        if existing:
            # Update existing
            result = self.client.table("screenshot_configs").update(config_data).eq("id", existing.id).execute()
        else:
            # Insert new
            result = self.client.table("screenshot_configs").insert(config_data).execute()

        return ScreenshotConfigResponse(**result.data[0])

    async def delete_screenshot_config(self, config_id: str) -> bool:
        """Delete a screenshot config"""
        result = self.client.table("screenshot_configs").delete().eq("id", config_id).execute()
        return len(result.data) > 0

    # ==================== Policy Site Configs ====================

    async def get_policy_site(self, project_id: str) -> Optional[PolicySiteResponse]:
        """Get the single policy site config for a project."""
        result = (
            self.client.table("policy_site_configs")
            .select("*")
            .eq("project_id", project_id)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return PolicySiteResponse(**result.data[0])
        return None

    async def save_policy_site(
        self,
        project_id: str,
        data: PolicySiteCreate,
    ) -> PolicySiteResponse:
        """Save or update the unique policy site config for a project."""
        existing = await self.get_policy_site(project_id)
        policy_data = {
            "project_id": project_id,
            "version": data.version,
            "locale_default": data.locale_default,
            "answers": data.answers.model_dump(mode="json"),
            "render_data": data.render_data.model_dump(mode="json"),
            "published": data.published,
        }

        if existing:
            result = (
                self.client.table("policy_site_configs")
                .update(policy_data)
                .eq("id", existing.id)
                .execute()
            )
        else:
            result = self.client.table("policy_site_configs").insert(policy_data).execute()

        return PolicySiteResponse(**result.data[0])

    # ==================== Project Entitlements ====================

    async def get_project_entitlement(self, project_id: str) -> Optional[ProjectEntitlementResponse]:
        """Get the current entitlement row for a project."""
        result = (
            self.client.table("project_entitlements")
            .select("*")
            .eq("project_id", project_id)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return ProjectEntitlementResponse(**result.data[0])
        return None

    async def ensure_project_entitlement(self, project_id: str) -> ProjectEntitlementResponse:
        """Ensure every project has a default free entitlement row."""
        existing = await self.get_project_entitlement(project_id)
        if existing:
            return existing

        return await self.save_project_entitlement(
            project_id,
            ProjectEntitlementCreate(
                project_id=project_id,
                **build_entitlement_payload("free"),
            ),
        )

    async def save_project_entitlement(
        self,
        project_id: str,
        data: ProjectEntitlementCreate,
    ) -> ProjectEntitlementResponse:
        """Create or update the current entitlement row for a project."""
        existing = await self.get_project_entitlement(project_id)
        payload = data.model_dump(mode="json")

        if existing:
            result = (
                self.client.table("project_entitlements")
                .update(payload)
                .eq("id", existing.id)
                .execute()
            )
        else:
            result = self.client.table("project_entitlements").insert(payload).execute()

        return ProjectEntitlementResponse(**result.data[0])

    async def increment_ai_quota_usage(self, project_id: str, units: int = 1) -> Optional[ProjectEntitlementResponse]:
        """Consume AI quota atomically for a project."""
        result = self.client.rpc(
            "consume_project_ai_quota",
            {
                "p_project_id": project_id,
                "p_units": units,
            },
        ).execute()
        if result.data and len(result.data) > 0:
            row = result.data[0]
            if row.get("consumed"):
                return await self.get_project_entitlement(project_id)
        return None

    # ==================== Payment Orders ====================

    async def get_payment_order_by_checkout_session(
        self,
        checkout_session_id: str,
    ) -> Optional[PaymentOrderResponse]:
        """Get a payment order by Stripe checkout session ID."""
        result = (
            self.client.table("payment_orders")
            .select("*")
            .eq("stripe_checkout_session_id", checkout_session_id)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return PaymentOrderResponse(**result.data[0])
        return None

    async def create_payment_order(self, data: PaymentOrderCreate) -> PaymentOrderResponse:
        """Create a new payment order row."""
        result = self.client.table("payment_orders").insert(data.model_dump(mode="json")).execute()
        return PaymentOrderResponse(**result.data[0])

    async def update_payment_order_by_checkout_session(
        self,
        checkout_session_id: str,
        updates: Dict[str, Any],
    ) -> Optional[PaymentOrderResponse]:
        """Update an existing payment order identified by checkout session ID."""
        result = (
            self.client.table("payment_orders")
            .update(updates)
            .eq("stripe_checkout_session_id", checkout_session_id)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return PaymentOrderResponse(**result.data[0])
        return None

    # ==================== AI Usage Events ====================

    async def create_ai_usage_event(self, data: AiUsageEventCreate) -> AiUsageEventResponse:
        """Create an AI usage event record."""
        result = self.client.table("ai_usage_events").insert(data.model_dump(mode="json")).execute()
        return AiUsageEventResponse(**result.data[0])

    async def get_ai_usage_event_by_key(self, idempotency_key: str) -> Optional[AiUsageEventResponse]:
        """Get an AI usage event by idempotency key."""
        result = (
            self.client.table("ai_usage_events")
            .select("*")
            .eq("idempotency_key", idempotency_key)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return AiUsageEventResponse(**result.data[0])
        return None


# Global database client instance
db: Optional[DatabaseClient] = None


def get_db() -> DatabaseClient:
    """Get or create database client"""
    global db
    if db is None:
        db = DatabaseClient()
    return db
