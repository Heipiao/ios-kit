"""
API routes for projects and assets
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import uuid
import mimetypes
from pathlib import Path

from models import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    AssetResponse,
    ScreenshotConfigCreate,
    ScreenshotConfigDetailResponse,
    ProjectsListResponse,
    ProjectDetailResponse,
    AssetUploadResponse,
    SuccessResponse,
)
from database import get_db, DatabaseClient

router = APIRouter()


# ==================== Helper Functions ====================

async def get_current_user_id(request: Request) -> str:
    """
    Get current user ID from request.
    For now, returns a demo user ID. In production, this should extract
    the user ID from the Supabase JWT token.
    """
    # TODO: Implement proper Supabase auth
    # For demo/development, use a fixed user ID
    return "00000000-0000-0000-0000-000000000001"


def get_dependency_db() -> DatabaseClient:
    """Get database client dependency"""
    return get_db()


# ==================== Project Routes ====================

@router.get("/projects", response_model=ProjectsListResponse)
async def list_projects(
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get all projects for the current user"""
    user_id = await get_current_user_id(request)
    projects = await db.get_projects(user_id)
    return {"projects": projects}


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get project details with assets and screenshot config"""
    user_id = await get_current_user_id(request)

    # Get project
    project = await db.get_project(project_id, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get assets
    assets = await db.get_assets(project_id=project_id)

    # Get screenshot configs
    configs = await db.get_screenshot_configs(project_id, user_id)
    screenshot_config = None
    if configs:
        screenshot_config = {
            "ai_raw": configs.get("ai_original")
        }
        if configs.get("user_edited"):
            screenshot_config["user_edited"] = configs["user_edited"]
        if configs.get("ai_original") and configs["ai_original"].exported_png_urls:
            screenshot_config["exported_pngs"] = configs["ai_original"].exported_png_urls

    return {
        "project": project,
        "assets": assets,
        "screenshot_config": screenshot_config
    }


@router.post("/projects")
async def create_project(
    data: ProjectCreate,
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Create a new project"""
    user_id = await get_current_user_id(request)

    # Create project
    project = await db.create_project(data, user_id)

    # If screenshot IDs are provided, associate them with the project
    if data.screenshot_ids:
        for screenshot_id in data.screenshot_ids:
            await db.update_asset(screenshot_id, {"project_id": project.id}, user_id)

    # If logo ID is provided, associate it with the project
    if data.logo_id:
        await db.update_asset(data.logo_id, {"project_id": project.id}, user_id)

    # Get all assets for this project
    assets = await db.get_assets(project_id=project.id)

    return {"project": project, "assets": assets}


@router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Update an existing project"""
    user_id = await get_current_user_id(request)

    project = await db.update_project(project_id, data, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"project": project}


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Delete a project"""
    user_id = await get_current_user_id(request)

    success = await db.delete_project(project_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"success": True}


# ==================== Asset Routes ====================

@router.post("/assets/upload")
async def upload_asset(
    file: UploadFile = File(...),
    type: str = Form(...),
    projectId: Optional[str] = Form(None),
    request: Request = None,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Upload an asset (screenshot or logo)"""
    user_id = await get_current_user_id(request)

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else ".png"
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Create storage path
    storage_path = f"{user_id}/{unique_filename}"

    # Read file content
    file_content = await file.read()
    file_size = len(file_content)

    # Upload to Supabase Storage
    storage_response = db.client.storage.from_("assets").upload(
        storage_path,
        file_content,
        {"content-type": file.content_type}
    )

    # Get public URL
    storage_url = db.client.storage.from_("assets").get_public_url(storage_path)

    # Create asset record
    asset_data = {
        "type": type,
        "filename": file.filename or unique_filename,
        "project_id": projectId,
        "storage_path": storage_path,
        "storage_url": storage_url,
        "mime_type": file.content_type,
        "file_size": file_size,
    }
    asset = await db.create_asset(
        type=asset_data["type"],
        filename=asset_data["filename"],
        project_id=asset_data["project_id"],
        storage_path=asset_data["storage_path"],
        storage_url=asset_data["storage_url"],
        mime_type=asset_data["mime_type"],
        file_size=asset_data["file_size"],
        user_id=user_id
    )

    return {"asset": asset, "storage_url": storage_url}


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: str,
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Delete an asset"""
    user_id = await get_current_user_id(request)

    # Get asset to delete storage file
    asset = await db.get_asset(asset_id, user_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Delete from storage
    try:
        db.client.storage.from_("assets").remove([asset.storage_path])
    except Exception:
        pass  # Continue even if storage deletion fails

    # Delete from database
    success = await db.delete_asset(asset_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")

    return {"success": True}


# ==================== Screenshot Config Routes ====================

@router.get("/projects/{project_id}/screenshot-config")
async def get_screenshot_config(
    project_id: str,
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get screenshot config for a project"""
    user_id = await get_current_user_id(request)

    # Check if project exists
    project = await db.get_project(project_id, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get configs
    configs = await db.get_screenshot_configs(project_id, user_id)

    result = {}
    if configs.get("ai_original"):
        result["aiRaw"] = configs["ai_original"].config
    if configs.get("user_edited"):
        result["userEdited"] = configs["user_edited"].config
    if configs.get("ai_original") and configs["ai_original"].exported_png_urls:
        result["exportedPngs"] = configs["ai_original"].exported_png_urls

    return result


@router.post("/projects/{project_id}/screenshot-config")
async def save_screenshot_config(
    project_id: str,
    data: ScreenshotConfigCreate,
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Save screenshot config for a project"""
    user_id = await get_current_user_id(request)

    # Check if project exists
    project = await db.get_project(project_id, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Save config
    config = await db.save_screenshot_config(project_id, data, user_id)

    return {"success": True, "config_id": config.id}
