"""
Project and Asset types for API requests/responses
"""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ProjectBase(BaseModel):
    """Base project schema"""
    name: str
    description: Optional[str] = ""
    device_type: str


class ProjectCreate(ProjectBase):
    """Schema for creating a project"""
    screenshot_ids: Optional[List[str]] = []
    logo_id: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = None
    description: Optional[str] = None
    device_type: Optional[str] = None


class ProjectResponse(BaseModel):
    """Schema for project response"""
    id: str
    name: str
    description: str
    device_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssetBase(BaseModel):
    """Base asset schema"""
    type: str  # 'screenshot', 'logo', 'other'
    filename: str


class AssetCreate(AssetBase):
    """Schema for creating an asset"""
    project_id: Optional[str] = None
    storage_path: str
    storage_url: str
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None


class AssetResponse(BaseModel):
    """Schema for asset response"""
    id: str
    project_id: str
    type: str
    storage_url: str
    filename: str
    width: Optional[int]
    height: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ScreenshotConfigBase(BaseModel):
    """Base screenshot config schema"""
    version: str  # 'ai_original' or 'user_edited'
    config: Any  # AiLayerTreeConfig as JSON


class ScreenshotConfigCreate(ScreenshotConfigBase):
    """Schema for creating a screenshot config"""
    project_id: str
    exported_png_urls: Optional[List[str]] = None


class ScreenshotConfigResponse(BaseModel):
    """Schema for screenshot config response"""
    id: str
    project_id: str
    version: str
    config: Any
    exported_png_urls: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# API Response wrappers
class ProjectsListResponse(BaseModel):
    """Response for listing projects"""
    projects: List[ProjectResponse]


class ProjectDetailResponse(BaseModel):
    """Response for project detail with assets"""
    project: ProjectResponse
    assets: List[AssetResponse]
    screenshot_config: Optional[dict] = None


class AssetUploadResponse(BaseModel):
    """Response for asset upload"""
    asset: AssetResponse
    storage_url: str


class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool


class ScreenshotConfigDetailResponse(BaseModel):
    """Response for screenshot config detail"""
    ai_raw: Optional[Any] = None
    user_edited: Optional[Any] = None
    exported_pngs: Optional[List[str]] = None
