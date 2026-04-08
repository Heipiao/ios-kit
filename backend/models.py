"""
Project and Asset types for API requests/responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Literal, Dict
from datetime import datetime, date


class ProjectBase(BaseModel):
    """Base project schema"""
    name: str
    description: Optional[str] = ""
    device_type: Optional[str] = ""


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
    device_type: Optional[str] = None
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
    project_id: Optional[str] = None
    type: str
    storage_path: Optional[str] = None
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
    projects: List["ProjectListItemResponse"]


class ProjectListItemResponse(BaseModel):
    """Project list item with compact entitlement info."""
    project: ProjectResponse
    entitlement_summary: Optional["ProjectEntitlementSummary"] = None


class ProjectDetailResponse(BaseModel):
    """Response for project detail with assets"""
    project: ProjectResponse
    assets: List[AssetResponse]
    screenshot_config: Optional[dict] = None
    policy_site_summary: Optional["PolicySiteSummary"] = None
    entitlement_summary: Optional["ProjectEntitlementSummary"] = None


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


PlanCode = Literal["free", "base", "pro"]
EntitlementStatus = Literal["inactive", "active", "revoked"]
PaymentOrderStatus = Literal["pending", "paid", "failed", "refunded", "expired"]
PaymentMode = Literal["payment"]
AiFeatureType = Literal["screenshots_ai_generate", "metadata_ai_generate", "policy_ai_generate"]


class ProjectEntitlementBase(BaseModel):
    """Base project entitlement schema."""
    plan_code: PlanCode
    status: EntitlementStatus = "active"
    ai_quota_total: Optional[int] = None
    ai_quota_used: int = 0


class ProjectEntitlementCreate(ProjectEntitlementBase):
    """Schema for creating or updating project entitlements."""
    project_id: str


class ProjectEntitlementResponse(ProjectEntitlementBase):
    """Stored project entitlement response."""
    id: str
    project_id: str
    activated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectEntitlementSummary(BaseModel):
    """Frontend-facing entitlement summary."""
    plan_code: PlanCode
    status: EntitlementStatus
    screenshot_hd_export_enabled: bool
    screenshot_export_enabled: bool
    screenshot_multiversion_enabled: bool
    screenshot_multilingual_enabled: bool
    policy_publish_enabled: bool
    policy_multilingual_enabled: bool
    policy_hosting_enabled: bool
    ai_quota_total: Optional[int]
    ai_quota_used: int
    ai_quota_remaining: Optional[int]
    can_upgrade_to_base: bool
    can_upgrade_to_pro: bool


class PaymentOrderCreate(BaseModel):
    """Schema for creating a payment order."""
    project_id: str
    from_plan_code: PlanCode
    stripe_checkout_session_id: str
    stripe_payment_intent_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    plan_code: PlanCode
    amount: int
    currency: str
    mode: PaymentMode = "payment"
    status: PaymentOrderStatus = "pending"
    provider_event_id: Optional[str] = None
    provider_payload: Optional[Dict[str, Any]] = None


class PaymentOrderResponse(BaseModel):
    """Stored payment order response."""
    id: str
    project_id: str
    from_plan_code: PlanCode
    stripe_checkout_session_id: str
    stripe_payment_intent_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    plan_code: PlanCode
    amount: int
    currency: str
    mode: PaymentMode
    status: PaymentOrderStatus
    provider_event_id: Optional[str] = None
    provider_payload: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AiUsageEventCreate(BaseModel):
    """Schema for recording AI usage."""
    project_id: str
    feature_type: AiFeatureType
    units: int = 1
    source: str = "api"
    result_status: Literal["succeeded", "failed"] = "succeeded"
    idempotency_key: str
    request_ref: Optional[str] = None


class AiUsageEventResponse(BaseModel):
    """Stored AI usage event response."""
    id: str
    project_id: str
    feature_type: AiFeatureType
    units: int
    source: str
    result_status: Literal["succeeded", "failed"]
    idempotency_key: str
    request_ref: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CheckoutSessionCreateRequest(BaseModel):
    """Request payload for creating a checkout session."""
    plan_code: Literal["base", "pro"]


class CheckoutSessionResponse(BaseModel):
    """Response with a hosted checkout URL."""
    checkout_url: str
    session_id: str
    plan_code: PlanCode


PolicyLocale = Literal["en", "zh"]
PolicyDataType = Literal[
    "contact_info",
    "user_content",
    "identifiers",
    "usage_data",
    "purchase_info",
    "diagnostics",
    "none",
]
PolicyThirdPartyService = Literal[
    "firebase",
    "supabase",
    "openai",
    "anthropic",
    "stripe",
    "revenuecat",
    "other",
    "none",
]


class PolicyQuestionAnswers(BaseModel):
    """Normalized questionnaire answers for the policy site."""
    app_name: str
    company_name: str
    support_email: str
    website_url: Optional[str] = None
    effective_date: date
    has_account_creation: bool = False
    collects_personal_data: bool = False
    data_types: List[PolicyDataType] = Field(default_factory=list)
    uses_third_party_services: List[PolicyThirdPartyService] = Field(default_factory=list)
    allows_account_deletion: bool = False
    countries_or_region_scope: str = "Worldwide"


class PolicyDocumentSection(BaseModel):
    """Structured section for legal document rendering."""
    heading: str
    paragraphs: List[str] = Field(default_factory=list)
    bullets: List[str] = Field(default_factory=list)


class PolicyDocumentRender(BaseModel):
    """Structured legal document render data for one locale."""
    title: str
    effective_date_label: str
    effective_date_value: str
    intro: Optional[str] = None
    sections: List[PolicyDocumentSection] = Field(default_factory=list)
    contact_email: Optional[str] = None
    website_url: Optional[str] = None


class PolicyRenderData(BaseModel):
    """All public render data for privacy and terms pages."""
    privacy: Dict[PolicyLocale, PolicyDocumentRender]
    terms: Dict[PolicyLocale, PolicyDocumentRender]


class PolicySiteBase(BaseModel):
    """Base policy site schema."""
    version: str = "user_edited"
    locale_default: PolicyLocale = "en"
    answers: PolicyQuestionAnswers
    render_data: PolicyRenderData
    published: bool = True


class PolicySiteGenerateRequest(BaseModel):
    """Request payload for generating policy pages from answers."""
    answers: PolicyQuestionAnswers
    locale_default: PolicyLocale = "en"


class PolicySiteCreate(PolicySiteBase):
    """Schema for creating or updating a project policy site."""
    project_id: str


class PolicySiteResponse(BaseModel):
    """Stored policy site response."""
    id: str
    project_id: str
    version: str
    locale_default: PolicyLocale
    answers: PolicyQuestionAnswers
    render_data: PolicyRenderData
    published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PolicySiteSummary(BaseModel):
    """Compact summary used on the project detail page."""
    published: bool
    updated_at: datetime
    privacy_url: str
    terms_url: str


class PolicyPublicDataResponse(BaseModel):
    """Public policy data used by anonymous policy pages."""
    project_id: str
    app_name: str
    locale_default: PolicyLocale
    privacy_url: str
    terms_url: str
    render_data: PolicyRenderData
    entitlement_summary: Optional[ProjectEntitlementSummary] = None
    updated_at: datetime


class PolicySitePreviewResponse(BaseModel):
    """Draft preview for policy pages without publishing."""
    render_data: PolicyRenderData


ProjectDetailResponse.model_rebuild()
