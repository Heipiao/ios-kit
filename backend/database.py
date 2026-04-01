"""
Database client for Supabase
"""
import os
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
from datetime import datetime

from models import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    AssetCreate,
    AssetResponse,
    ScreenshotConfigCreate,
    ScreenshotConfigResponse,
)


class DatabaseClient:
    """Supabase database client"""

    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")

        self.client: Client = create_client(supabase_url, supabase_key)

    # ==================== Projects ====================

    async def get_projects(self, user_id: str) -> List[ProjectResponse]:
        """Get all projects for a user"""
        result = self.client.table("projects").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return [ProjectResponse(**project) for project in result.data]

    async def get_project(self, project_id: str, user_id: str) -> Optional[ProjectResponse]:
        """Get a single project by ID"""
        result = self.client.table("projects").select("*").eq("id", project_id).eq("user_id", user_id).execute()
        if result.data and len(result.data) > 0:
            return ProjectResponse(**result.data[0])
        return None

    async def create_project(self, data: ProjectCreate, user_id: str) -> ProjectResponse:
        """Create a new project"""
        project_data = {
            "name": data.name,
            "description": data.description or "",
            "device_type": data.device_type,
            "user_id": user_id,
        }
        result = self.client.table("projects").insert(project_data).execute()
        return ProjectResponse(**result.data[0])

    async def update_project(self, project_id: str, data: ProjectUpdate, user_id: str) -> Optional[ProjectResponse]:
        """Update an existing project"""
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_data:
            return await self.get_project(project_id, user_id)

        result = self.client.table("projects").update(update_data).eq("id", project_id).eq("user_id", user_id).execute()
        if result.data and len(result.data) > 0:
            return ProjectResponse(**result.data[0])
        return None

    async def delete_project(self, project_id: str, user_id: str) -> bool:
        """Delete a project"""
        result = self.client.table("projects").delete().eq("id", project_id).eq("user_id", user_id).execute()
        return len(result.data) > 0

    # ==================== Assets ====================

    async def get_assets(self, project_id: Optional[str] = None, user_id: Optional[str] = None) -> List[AssetResponse]:
        """Get assets, optionally filtered by project"""
        query = self.client.table("assets").select("*")
        if project_id:
            query = query.eq("project_id", project_id)
        if user_id:
            query = query.eq("user_id", user_id)
        result = query.order("created_at", desc=True).execute()
        return [AssetResponse(**asset) for asset in result.data]

    async def get_asset(self, asset_id: str, user_id: str) -> Optional[AssetResponse]:
        """Get a single asset by ID"""
        result = self.client.table("assets").select("*").eq("id", asset_id).eq("user_id", user_id).execute()
        if result.data and len(result.data) > 0:
            return AssetResponse(**result.data[0])
        return None

    async def create_asset(self, data: AssetCreate, user_id: str) -> AssetResponse:
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
            "user_id": user_id,
        }
        result = self.client.table("assets").insert(asset_data).execute()
        return AssetResponse(**result.data[0])

    async def update_asset(self, asset_id: str, data: Dict[str, Any], user_id: str) -> Optional[AssetResponse]:
        """Update an existing asset"""
        result = self.client.table("assets").update(data).eq("id", asset_id).eq("user_id", user_id).execute()
        if result.data and len(result.data) > 0:
            return AssetResponse(**result.data[0])
        return None

    async def delete_asset(self, asset_id: str, user_id: str) -> bool:
        """Delete an asset"""
        result = self.client.table("assets").delete().eq("id", asset_id).eq("user_id", user_id).execute()
        return len(result.data) > 0

    # ==================== Screenshot Configs ====================

    async def get_screenshot_config(
        self,
        project_id: str,
        version: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Optional[ScreenshotConfigResponse]:
        """Get screenshot config, optionally by version"""
        query = self.client.table("screenshot_configs").select("*").eq("project_id", project_id)
        if version:
            query = query.eq("version", version)
        if user_id:
            # Join with projects to check user ownership
            query = query.select("*, projects!inner(user_id)").eq("projects.user_id", user_id)

        result = query.order("created_at", desc=True).limit(1).execute()
        if result.data and len(result.data) > 0:
            return ScreenshotConfigResponse(**result.data[0])
        return None

    async def get_screenshot_configs(
        self,
        project_id: str,
        user_id: str
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
        user_id: str
    ) -> ScreenshotConfigResponse:
        """Save a screenshot config (upsert by version)"""
        # Check if config exists for this version
        existing = await self.get_screenshot_config(project_id, data.version, user_id)

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

    async def delete_screenshot_config(self, config_id: str, user_id: str) -> bool:
        """Delete a screenshot config"""
        result = self.client.table("screenshot_configs").delete().eq("id", config_id).execute()
        return len(result.data) > 0


# Global database client instance
db: Optional[DatabaseClient] = None


def get_db() -> DatabaseClient:
    """Get or create database client"""
    global db
    if db is None:
        db = DatabaseClient()
    return db
