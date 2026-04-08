"""
API routes for projects and assets
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, Response
from typing import Optional, List
import os
import uuid
import mimetypes
import logging
import json
from pathlib import Path

from models import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    AssetCreate,
    AssetResponse,
    ScreenshotConfigCreate,
    ScreenshotConfigDetailResponse,
    PolicySiteGenerateRequest,
    PolicySitePreviewResponse,
    PolicySiteCreate,
    PolicySiteSummary,
    PolicyPublicDataResponse,
    ProjectEntitlementCreate,
    ProjectEntitlementSummary,
    CheckoutSessionCreateRequest,
    ProjectsListResponse,
    ProjectDetailResponse,
    AssetUploadResponse,
    SuccessResponse,
    PaymentOrderCreate,
    AiUsageEventCreate,
)
from database import get_db, DatabaseClient
from oss import get_oss_client
from policy_generator import build_policy_render_data
from pricing import build_entitlement_payload, summarize_entitlement, get_stripe_price_id, get_site_url

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== Helper Functions ====================

def get_dependency_db() -> DatabaseClient:
    """Get database client dependency"""
    return get_db()


def build_policy_urls(project_id: str) -> tuple[str, str]:
    """Build relative public URLs for a project's policy pages."""
    return (f"/p/{project_id}/privacy", f"/p/{project_id}/terms")


def serialize_stripe_value(value):
    """Convert Stripe SDK objects into plain JSON-safe data."""
    if hasattr(value, "to_dict_recursive"):
        return value.to_dict_recursive()
    if isinstance(value, dict):
        return {key: serialize_stripe_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [serialize_stripe_value(item) for item in value]
    return value


async def get_project_entitlement_summary(
    db: DatabaseClient,
    project_id: str,
) -> ProjectEntitlementSummary:
    """Ensure and summarize the current project entitlement."""
    entitlement = await db.ensure_project_entitlement(project_id)
    return summarize_entitlement(entitlement)


def require_policy_publish_access(entitlement: ProjectEntitlementSummary):
    """Raise if the current project cannot publish policy pages."""
    if not entitlement.policy_publish_enabled:
        raise_payment_required(
            code="policy_publish_requires_base",
            message="Policy publishing requires Base or Pro",
            feature_key="policy_publish",
            target_plan="base",
        )


def raise_payment_required(*, code: str, message: str, feature_key: str, target_plan: str):
    """Raise a stable payment required error for frontend paywalls."""
    raise HTTPException(
        status_code=402,
        detail={
            "code": code,
            "message": message,
            "feature_key": feature_key,
            "target_plan": target_plan,
        },
    )


def require_policy_hosting_access(entitlement: ProjectEntitlementSummary):
    """Raise if the current project cannot host public policy pages."""
    if not entitlement.policy_hosting_enabled:
        raise_payment_required(
            code="policy_hosting_requires_base",
            message="Policy hosting requires Base or Pro",
            feature_key="policy_hosting",
            target_plan="base",
        )


def require_screenshot_hd_export_access(entitlement: ProjectEntitlementSummary):
    """Raise if the current project cannot export HD screenshots."""
    if not entitlement.screenshot_hd_export_enabled:
        raise_payment_required(
            code="screenshot_hd_export_requires_base",
            message="HD screenshot export requires Base or Pro",
            feature_key="screenshot_hd_export",
            target_plan="base",
        )


def require_screenshot_multiversion_access(entitlement: ProjectEntitlementSummary):
    """Raise if the current project cannot export multiple versions."""
    if not entitlement.screenshot_multiversion_enabled:
        raise_payment_required(
            code="screenshot_multiversion_requires_pro",
            message="Multi-version screenshot export requires Pro",
            feature_key="screenshot_multiversion",
            target_plan="pro",
        )


def require_screenshot_multilingual_access(entitlement: ProjectEntitlementSummary):
    """Raise if the current project cannot export multilingual screenshots."""
    if not entitlement.screenshot_multilingual_enabled:
        raise_payment_required(
            code="screenshot_multilingual_requires_pro",
            message="Multilingual screenshots require Pro",
            feature_key="screenshot_multilingual",
            target_plan="pro",
        )


def require_policy_multilingual_access(entitlement: ProjectEntitlementSummary):
    """Raise if the current project cannot generate multilingual policy pages."""
    if not entitlement.policy_multilingual_enabled:
        raise_payment_required(
            code="policy_multilingual_requires_pro",
            message="Multilingual policy pages require Pro",
            feature_key="policy_multilingual",
            target_plan="pro",
        )


async def record_ai_usage(
    db: DatabaseClient,
    project_id: str,
    *,
    feature_type: str,
    units: int = 1,
    source: str = "api",
    request_ref: Optional[str] = None,
) -> ProjectEntitlementSummary:
    """Atomically consume AI quota and write an audit event."""
    entitlement = await db.ensure_project_entitlement(project_id)
    summary = summarize_entitlement(entitlement)

    if summary.plan_code == "base" and summary.ai_quota_remaining is not None and summary.ai_quota_remaining < units:
        raise_payment_required(
            code="ai_quota_exceeded_upgrade_to_pro",
            message="This project has used all Base AI runs. Upgrade to Pro for unlimited AI.",
            feature_key=feature_type,
            target_plan="pro",
        )

    idempotency_key = f"{project_id}:{feature_type}:{request_ref or uuid.uuid4()}"
    existing_event = await db.get_ai_usage_event_by_key(idempotency_key)
    if existing_event:
        updated_entitlement = await db.ensure_project_entitlement(project_id)
        return summarize_entitlement(updated_entitlement)

    if summary.plan_code == "base":
        updated_entitlement = await db.increment_ai_quota_usage(project_id, units)
        if not updated_entitlement:
            raise_payment_required(
                code="ai_quota_exceeded_upgrade_to_pro",
                message="This project has used all Base AI runs. Upgrade to Pro for unlimited AI.",
                feature_key=feature_type,
                target_plan="pro",
            )
        entitlement = updated_entitlement

    await db.create_ai_usage_event(
        AiUsageEventCreate(
            project_id=project_id,
            feature_type=feature_type,
            units=units,
            source=source,
            result_status="succeeded",
            idempotency_key=idempotency_key,
            request_ref=request_ref,
        )
    )
    return summarize_entitlement(entitlement)


# ==================== Project Routes ====================

@router.get("/projects", response_model=ProjectsListResponse)
async def list_projects(
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get all projects"""
    projects = await db.get_projects()
    project_items = []
    for project in projects:
        entitlement_summary = await get_project_entitlement_summary(db, project.id)
        project_items.append(
            {
                "project": project,
                "entitlement_summary": entitlement_summary,
            }
        )
    return {"projects": project_items}


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get project details with assets and screenshot config"""
    # Get project
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    entitlement_summary = await get_project_entitlement_summary(db, project_id)

    # Get assets
    assets = await db.get_assets(project_id=project_id)

    # Get screenshot configs
    configs = await db.get_screenshot_configs(project_id)
    screenshot_config = None
    if configs:
        screenshot_config = {
            "ai_raw": configs.get("ai_original")
        }
        if configs.get("user_edited"):
            screenshot_config["user_edited"] = configs["user_edited"]
        if configs.get("ai_original") and configs["ai_original"].exported_png_urls:
            screenshot_config["exported_pngs"] = configs["ai_original"].exported_png_urls

    policy_site = await db.get_policy_site(project_id)
    policy_site_summary = None
    if policy_site and policy_site.published:
        privacy_url, terms_url = build_policy_urls(project_id)
        policy_site_summary = PolicySiteSummary(
            published=policy_site.published,
            updated_at=policy_site.updated_at,
            privacy_url=privacy_url,
            terms_url=terms_url,
        )

    return {
        "project": project,
        "assets": assets,
        "screenshot_config": screenshot_config,
        "policy_site_summary": policy_site_summary,
        "entitlement_summary": entitlement_summary,
    }


@router.post("/projects")
async def create_project(
    data: ProjectCreate,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Create a new project"""
    # Create project
    project = await db.create_project(data)

    # If screenshot IDs are provided, associate them with the project
    if data.screenshot_ids:
        for screenshot_id in data.screenshot_ids:
            await db.update_asset(screenshot_id, {"project_id": project.id})

    # If logo ID is provided, associate it with the project
    if data.logo_id:
        await db.update_asset(data.logo_id, {"project_id": project.id})

    await db.ensure_project_entitlement(project.id)

    # Get all assets for this project
    assets = await db.get_assets(project_id=project.id)

    return {"project": project, "assets": assets}


@router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Update an existing project"""
    project = await db.update_project(project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"project": project}


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Delete a project"""
    success = await db.delete_project(project_id)
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
    client_host = request.client.host if request and request.client else "unknown"

    logger.info(
        "upload_asset started: client=%s filename=%s type=%s content_type=%s project_id=%s",
        client_host,
        file.filename,
        type,
        file.content_type,
        projectId,
    )

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        logger.warning(
            "upload_asset rejected non-image file: filename=%s content_type=%s type=%s",
            file.filename,
            file.content_type,
            type,
        )
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else ".png"
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Create storage path
    storage_path = f"uploads/{unique_filename}"

    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    logger.info(
        "upload_asset file loaded: filename=%s size=%s storage_path=%s",
        file.filename,
        file_size,
        storage_path,
    )

    # Upload to Aliyun OSS
    try:
        oss_client = get_oss_client()
        oss_client.upload_file(
            storage_path,
            file_content,
            file.content_type
        )
    except Exception as exc:
        logger.exception(
            "upload_asset OSS upload failed: filename=%s storage_path=%s size=%s content_type=%s project_id=%s",
            file.filename,
            storage_path,
            file_size,
            file.content_type,
            projectId,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to upload file to Aliyun OSS",
        ) from exc

    # Get public URL
    try:
        storage_url = oss_client.get_public_url(storage_path)
        logger.info(
            "upload_asset OSS upload succeeded: filename=%s storage_path=%s storage_url=%s",
            file.filename,
            storage_path,
            storage_url,
        )
    except Exception as exc:
        logger.exception(
            "upload_asset failed to build OSS public URL: filename=%s storage_path=%s",
            file.filename,
            storage_path,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to build file URL after upload",
        ) from exc

    # Create asset record
    try:
        asset = await db.create_asset(
            AssetCreate(
                type=type,
                filename=file.filename or unique_filename,
                project_id=projectId,
                storage_path=storage_path,
                storage_url=storage_url,
                mime_type=file.content_type,
                file_size=file_size,
            ),
        )
    except Exception as exc:
        logger.exception(
            "upload_asset database insert failed: filename=%s storage_path=%s storage_url=%s project_id=%s",
            file.filename,
            storage_path,
            storage_url,
            projectId,
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to save uploaded asset metadata",
        ) from exc

    logger.info(
        "upload_asset completed: asset_id=%s filename=%s type=%s project_id=%s",
        asset.id,
        asset.filename,
        asset.type,
        asset.project_id,
    )

    return {"asset": asset, "storage_url": storage_url}


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Delete an asset"""
    # Get asset to delete storage file
    asset = await db.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Delete from OSS
    try:
        oss_client = get_oss_client()
        oss_client.delete_file(asset.storage_path)
    except Exception:
        pass  # Continue even if storage deletion fails

    # Delete from database
    success = await db.delete_asset(asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")

    return {"success": True}


@router.get("/assets/{asset_id}/content")
async def get_asset_content(
    asset_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Proxy asset content from OSS for browser rendering/export."""
    asset = await db.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    storage_path = getattr(asset, "storage_path", None)
    if not storage_path:
        raise HTTPException(status_code=404, detail="Asset storage path not found")

    try:
        oss_client = get_oss_client()
        file_bytes = oss_client.download_file(storage_path)
    except Exception as exc:
        logger.exception("get_asset_content failed: asset_id=%s storage_path=%s", asset_id, storage_path)
        raise HTTPException(status_code=500, detail="Failed to load asset content") from exc

    media_type, _ = mimetypes.guess_type(asset.filename or storage_path)
    return Response(
      content=file_bytes,
      media_type=media_type or "application/octet-stream",
      headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# ==================== Screenshot Config Routes ====================

@router.get("/projects/{project_id}/screenshot-config")
async def get_screenshot_config(
    project_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get screenshot config for a project"""
    # Check if project exists
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get configs
    configs = await db.get_screenshot_configs(project_id)

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
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Save screenshot config for a project"""
    # Check if project exists
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Save config
    config = await db.save_screenshot_config(project_id, data)

    return {"success": True, "config_id": config.id}


@router.get("/projects/{project_id}/entitlement")
async def get_project_entitlement(
    project_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get the computed entitlement summary for a project."""
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"entitlement_summary": await get_project_entitlement_summary(db, project_id)}


@router.post("/projects/{project_id}/screenshot/export-check")
async def check_screenshot_export_access(
    project_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Validate whether the project can export HD screenshots."""
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    entitlement_summary = await get_project_entitlement_summary(db, project_id)
    require_screenshot_hd_export_access(entitlement_summary)
    return {"success": True, "entitlement_summary": entitlement_summary}


# ==================== Policy Site Routes ====================

@router.get("/projects/{project_id}/policy-site")
async def get_policy_site(
    project_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get the current policy site config for a project."""
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    policy_site = await db.get_policy_site(project_id)
    entitlement_summary = await get_project_entitlement_summary(db, project_id)
    if not policy_site:
        return {"policy_site": None, "entitlement_summary": entitlement_summary}

    privacy_url, terms_url = build_policy_urls(project_id)
    return {
        "policy_site": policy_site,
        "privacy_url": privacy_url,
        "terms_url": terms_url,
        "entitlement_summary": entitlement_summary,
    }


@router.post("/projects/{project_id}/policy-site/preview", response_model=PolicySitePreviewResponse)
async def preview_policy_site(
    project_id: str,
    data: PolicySiteGenerateRequest,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Build a draft policy render preview without publishing."""
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return PolicySitePreviewResponse(
        render_data=build_policy_render_data(data.answers),
    )


@router.post("/projects/{project_id}/policy-site/generate")
async def generate_policy_site(
    project_id: str,
    data: PolicySiteGenerateRequest,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Generate and save a project's unique policy site config."""
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    entitlement_summary = await get_project_entitlement_summary(db, project_id)
    if data.locale_default != "en":
        require_policy_multilingual_access(entitlement_summary)
    require_policy_publish_access(entitlement_summary)

    render_data = build_policy_render_data(data.answers)
    saved = await db.save_policy_site(
        project_id,
        PolicySiteCreate(
            project_id=project_id,
            version="user_edited",
            locale_default=data.locale_default,
            answers=data.answers,
            render_data=render_data,
            published=True,
        ),
    )
    privacy_url, terms_url = build_policy_urls(project_id)
    return {
        "success": True,
        "policy_site": saved,
        "privacy_url": privacy_url,
        "terms_url": terms_url,
    }


@router.put("/projects/{project_id}/policy-site")
async def update_policy_site(
    project_id: str,
    data: PolicySiteGenerateRequest,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Update and regenerate a project's policy site config."""
    return await generate_policy_site(project_id, data, db)


@router.get("/p/{project_id}/policy-data")
async def get_public_policy_data(
    project_id: str,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Get public policy render data for anonymous policy pages."""
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    entitlement_summary = await get_project_entitlement_summary(db, project_id)
    require_policy_hosting_access(entitlement_summary)

    policy_site = await db.get_policy_site(project_id)
    if not policy_site or not policy_site.published:
        raise HTTPException(status_code=404, detail="Policy site not found")

    privacy_url, terms_url = build_policy_urls(project_id)
    return PolicyPublicDataResponse(
        project_id=project_id,
        app_name=policy_site.answers.app_name,
        locale_default=policy_site.locale_default,
        privacy_url=privacy_url,
        terms_url=terms_url,
        render_data=policy_site.render_data,
        entitlement_summary=entitlement_summary,
        updated_at=policy_site.updated_at,
    )


# ==================== Billing Routes ====================

@router.post("/projects/{project_id}/checkout-session")
async def create_checkout_session(
    project_id: str,
    data: CheckoutSessionCreateRequest,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Create a Stripe Checkout session for a project plan upgrade."""
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    entitlement = await db.ensure_project_entitlement(project_id)
    if entitlement.plan_code == data.plan_code and entitlement.status == "active":
        raise HTTPException(status_code=400, detail="Project already has this plan")
    if entitlement.plan_code == "pro":
        raise HTTPException(status_code=400, detail="Project is already on Pro")

    price_id = get_stripe_price_id(data.plan_code)
    if not price_id:
        raise HTTPException(status_code=500, detail=f"Missing Stripe price config for {data.plan_code}")

    try:
        import stripe
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Stripe SDK is not installed") from exc

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="STRIPE_SECRET_KEY is not configured")

    site_url = get_site_url().rstrip("/")
    success_url = f"{site_url}/projects/{project_id}?checkout=success"
    cancel_url = f"{site_url}/projects/{project_id}?checkout=cancelled"

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=project_id,
        metadata={
            "project_id": project_id,
            "plan_code": data.plan_code,
            "from_plan_code": entitlement.plan_code,
        },
    )

    existing_order = await db.get_payment_order_by_checkout_session(session.id)
    if not existing_order:
        await db.create_payment_order(
            PaymentOrderCreate(
                project_id=project_id,
                from_plan_code=entitlement.plan_code,
                stripe_checkout_session_id=session.id,
                stripe_payment_intent_id=session.payment_intent if isinstance(session.payment_intent, str) else None,
                stripe_customer_id=session.customer if isinstance(session.customer, str) else None,
                plan_code=data.plan_code,
                amount=session.amount_total or 0,
                currency=session.currency or "usd",
                mode="payment",
                status="pending",
                provider_payload=serialize_stripe_value(session),
            )
        )

    return {
        "checkout_url": session.url,
        "session_id": session.id,
        "plan_code": data.plan_code,
    }


@router.post("/stripe/webhook")
async def handle_stripe_webhook(
    request: Request,
    db: DatabaseClient = Depends(get_dependency_db)
):
    """Handle Stripe webhook events for project plan purchases."""
    try:
        import stripe
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Stripe SDK is not installed") from exc

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="STRIPE_SECRET_KEY is not configured")

    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload=payload, sig_header=signature, secret=webhook_secret)
        else:
            event = json.loads(payload.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook payload") from exc

    event_type = event["type"]
    event_id = event.get("id")
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        checkout_session_id = session["id"]
        project_id = session.get("client_reference_id") or session.get("metadata", {}).get("project_id")
        plan_code = session.get("metadata", {}).get("plan_code")
        from_plan_code = session.get("metadata", {}).get("from_plan_code") or "free"
        if not project_id or plan_code not in {"base", "pro"}:
            return {"received": True}

        existing_order = await db.get_payment_order_by_checkout_session(checkout_session_id)
        if existing_order and existing_order.status == "paid":
            return {"received": True}

        provider_payload = session
        if existing_order:
            await db.update_payment_order_by_checkout_session(
                checkout_session_id,
                {
                    "status": "paid",
                    "stripe_payment_intent_id": session.get("payment_intent"),
                    "stripe_customer_id": session.get("customer"),
                    "provider_event_id": event_id,
                    "provider_payload": provider_payload,
                },
            )
        else:
            await db.create_payment_order(
                PaymentOrderCreate(
                    project_id=project_id,
                    from_plan_code=from_plan_code,
                    stripe_checkout_session_id=checkout_session_id,
                    stripe_payment_intent_id=session.get("payment_intent"),
                    stripe_customer_id=session.get("customer"),
                    plan_code=plan_code,
                    amount=session.get("amount_total") or 0,
                    currency=session.get("currency") or "usd",
                    mode="payment",
                    status="paid",
                    provider_event_id=event_id,
                    provider_payload=provider_payload,
                )
            )

        current_entitlement = await db.ensure_project_entitlement(project_id)
        await db.save_project_entitlement(
            project_id,
            ProjectEntitlementCreate(
                project_id=project_id,
                **build_entitlement_payload(plan_code, ai_quota_used=current_entitlement.ai_quota_used or 0),
            ),
        )

    if event_type == "checkout.session.expired":
        session = event["data"]["object"]
        checkout_session_id = session["id"]
        await db.update_payment_order_by_checkout_session(
            checkout_session_id,
            {
                "status": "expired",
                "provider_event_id": event_id,
                "provider_payload": session,
            },
        )

    return {"received": True}
