// Projects API client

export type {
  Project,
  Asset,
  ScreenshotConfig,
  ProjectEntitlementSummary,
  CheckoutSessionResponse,
  BillingErrorDetail,
  PlanCode,
  PolicyQuestionAnswers,
  PolicySiteConfig,
  PolicySiteSummary,
  PolicyPublicData,
  PolicyLocale,
} from './project-types';
import {
  Project,
  Asset,
  ScreenshotConfig,
  ProjectEntitlementSummary,
  CheckoutSessionResponse,
  BillingErrorDetail,
  PlanCode,
  PolicyQuestionAnswers,
  PolicySiteConfig,
  PolicySiteSummary,
  PolicyPublicData,
  PolicyLocale,
} from './project-types';
import { AiLayerTreeConfig } from './layer-tree-types';

const API_BASE_URL = process.env.PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
const API_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  status: number;
  detail?: BillingErrorDetail | string;

  constructor(message: string, status: number, detail?: BillingErrorDetail | string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${API_TIMEOUT_MS / 1000}s`, 408);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function readApiError(response: Response, fallbackMessage: string): Promise<ApiError> {
  const rawBody = await response.text();
  let detail: BillingErrorDetail | string | undefined;
  let message = fallbackMessage;

  try {
    const parsed = JSON.parse(rawBody);
    if (typeof parsed.detail === 'string') {
      detail = parsed.detail;
      message = parsed.detail;
    } else if (parsed.detail && typeof parsed.detail === 'object') {
      detail = {
        code: parsed.detail.code,
        message: parsed.detail.message,
        featureKey: parsed.detail.feature_key,
        targetPlan: parsed.detail.target_plan,
      };
      if (detail.message) {
        message = detail.message;
      }
    } else if (parsed.detail?.message) {
      message = parsed.detail.message;
    } else if (parsed.message) {
      message = parsed.message;
    }
  } catch {
    if (rawBody) {
      detail = rawBody;
      message = rawBody;
    }
  }

  return new ApiError(message, response.status, detail);
}

export function getAssetContentUrl(assetId: string): string {
  return `/api/assets/${assetId}/content`;
}

function mapProject(project: any): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    deviceType: project.device_type || undefined,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

function mapAsset(asset: any): Asset {
  return {
    id: asset.id,
    projectId: asset.project_id,
    type: asset.type,
    storageUrl: asset.storage_url,
    filename: asset.filename,
    width: asset.width,
    height: asset.height,
    createdAt: asset.created_at,
  };
}

function mapEntitlementSummary(summary: any): ProjectEntitlementSummary {
  return {
    planCode: summary.plan_code,
    status: summary.status,
    screenshotHdExportEnabled: Boolean(summary.screenshot_hd_export_enabled),
    screenshotExportEnabled: Boolean(summary.screenshot_export_enabled),
    screenshotMultiversionEnabled: Boolean(summary.screenshot_multiversion_enabled),
    screenshotMultilingualEnabled: Boolean(summary.screenshot_multilingual_enabled),
    policyPublishEnabled: Boolean(summary.policy_publish_enabled),
    policyMultilingualEnabled: Boolean(summary.policy_multilingual_enabled),
    policyHostingEnabled: Boolean(summary.policy_hosting_enabled),
    aiQuotaTotal: summary.ai_quota_total ?? null,
    aiQuotaUsed: Number(summary.ai_quota_used || 0),
    aiQuotaRemaining: summary.ai_quota_remaining ?? null,
    canUpgradeToBase: Boolean(summary.can_upgrade_to_base),
    canUpgradeToPro: Boolean(summary.can_upgrade_to_pro),
  };
}

function mapPolicyRenderData(renderData: any) {
  return {
    privacy: {
      en: {
        title: renderData.privacy.en.title,
        effectiveDateLabel: renderData.privacy.en.effective_date_label,
        effectiveDateValue: renderData.privacy.en.effective_date_value,
        intro: renderData.privacy.en.intro,
        sections: renderData.privacy.en.sections,
        contactEmail: renderData.privacy.en.contact_email,
        websiteUrl: renderData.privacy.en.website_url,
      },
      zh: {
        title: renderData.privacy.zh.title,
        effectiveDateLabel: renderData.privacy.zh.effective_date_label,
        effectiveDateValue: renderData.privacy.zh.effective_date_value,
        intro: renderData.privacy.zh.intro,
        sections: renderData.privacy.zh.sections,
        contactEmail: renderData.privacy.zh.contact_email,
        websiteUrl: renderData.privacy.zh.website_url,
      },
    },
    terms: {
      en: {
        title: renderData.terms.en.title,
        effectiveDateLabel: renderData.terms.en.effective_date_label,
        effectiveDateValue: renderData.terms.en.effective_date_value,
        intro: renderData.terms.en.intro,
        sections: renderData.terms.en.sections,
        contactEmail: renderData.terms.en.contact_email,
        websiteUrl: renderData.terms.en.website_url,
      },
      zh: {
        title: renderData.terms.zh.title,
        effectiveDateLabel: renderData.terms.zh.effective_date_label,
        effectiveDateValue: renderData.terms.zh.effective_date_value,
        intro: renderData.terms.zh.intro,
        sections: renderData.terms.zh.sections,
        contactEmail: renderData.terms.zh.contact_email,
        websiteUrl: renderData.terms.zh.website_url,
      },
    },
  };
}

function mapPolicyAnswers(answers: any): PolicyQuestionAnswers {
  return {
    appName: answers.app_name,
    companyName: answers.company_name,
    supportEmail: answers.support_email,
    websiteUrl: answers.website_url || '',
    effectiveDate: answers.effective_date,
    hasAccountCreation: Boolean(answers.has_account_creation),
    collectsPersonalData: Boolean(answers.collects_personal_data),
    dataTypes: answers.data_types || [],
    usesThirdPartyServices: answers.uses_third_party_services || [],
    allowsAccountDeletion: Boolean(answers.allows_account_deletion),
    countriesOrRegionScope: answers.countries_or_region_scope || 'Worldwide',
  };
}

function mapPolicySiteConfig(config: any): PolicySiteConfig {
  return {
    id: config.id,
    projectId: config.project_id,
    version: config.version,
    localeDefault: config.locale_default,
    answers: mapPolicyAnswers(config.answers),
    renderData: mapPolicyRenderData(config.render_data),
    published: Boolean(config.published),
    createdAt: config.created_at,
    updatedAt: config.updated_at,
  };
}

function mapPolicySiteSummary(summary: any): PolicySiteSummary {
  return {
    published: Boolean(summary.published),
    updatedAt: summary.updated_at,
    privacyUrl: summary.privacy_url,
    termsUrl: summary.terms_url,
  };
}

function toBackendPolicyAnswers(answers: PolicyQuestionAnswers) {
  return {
    app_name: answers.appName,
    company_name: answers.companyName,
    support_email: answers.supportEmail,
    website_url: answers.websiteUrl || null,
    effective_date: answers.effectiveDate,
    has_account_creation: answers.hasAccountCreation,
    collects_personal_data: answers.collectsPersonalData,
    data_types: answers.dataTypes,
    uses_third_party_services: answers.usesThirdPartyServices,
    allows_account_deletion: answers.allowsAccountDeletion,
    countries_or_region_scope: answers.countriesOrRegionScope,
  };
}

// ==================== Projects ====================

export async function getProjects(): Promise<Project[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/projects`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to fetch projects');
  }
  const data = await response.json();
  return data.projects.map((item: any) => ({
    ...mapProject(item.project),
    entitlementSummary: item.entitlement_summary ? mapEntitlementSummary(item.entitlement_summary) : undefined,
  }));
}

export async function getProject(id: string): Promise<{
  project: Project;
  assets: Asset[];
  screenshotConfig?: {
    aiRaw: AiLayerTreeConfig;
    userEdited: AiLayerTreeConfig;
    exportedPngs: string[];
  };
  policySiteSummary?: PolicySiteSummary;
  entitlementSummary?: ProjectEntitlementSummary;
}> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/projects/${id}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to fetch project');
  }
  const data = await response.json();
  return {
    project: mapProject(data.project),
    assets: data.assets.map(mapAsset),
    screenshotConfig: data.screenshot_config
      ? {
          aiRaw: data.screenshot_config.ai_raw,
          userEdited: data.screenshot_config.user_edited,
          exportedPngs: data.screenshot_config.exported_pngs,
        }
      : undefined,
    policySiteSummary: data.policy_site_summary ? mapPolicySiteSummary(data.policy_site_summary) : undefined,
    entitlementSummary: data.entitlement_summary ? mapEntitlementSummary(data.entitlement_summary) : undefined,
  };
}

export async function createProject(data: {
  name: string;
  description: string;
  deviceType?: string;
  screenshotIds: string[];
  logoId?: string;
}): Promise<{ project: Project; assets: Asset[] }> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      device_type: data.deviceType ?? "",
      screenshot_ids: data.screenshotIds,
      logo_id: data.logoId,
    }),
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to create project');
  }
  const result = await response.json();
  return {
    project: mapProject(result.project),
    assets: result.assets.map(mapAsset),
  };
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    description?: string;
    deviceType?: string;
  }
): Promise<{ project: Project }> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      device_type: data.deviceType,
    }),
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to update project');
  }
  const result = await response.json();
  return { project: mapProject(result.project) };
}

export async function deleteProject(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to delete project');
  }
  return response.json();
}

// ==================== Assets ====================

export async function uploadAsset(
  file: File,
  type: 'screenshot' | 'logo',
  projectId?: string
): Promise<{ asset: Asset; storageUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (projectId) {
    formData.append('projectId', projectId);
  }

  const response = await fetch(`${API_BASE_URL}/api/assets/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const rawBody = await response.text();
    let serverDetail = rawBody;

    try {
      const parsed = JSON.parse(rawBody);
      serverDetail = parsed.detail || parsed.message || rawBody;
    } catch {
      // Keep raw text when the response body is not JSON.
    }

    console.error('uploadAsset failed', {
      apiBaseUrl: API_BASE_URL,
      status: response.status,
      statusText: response.statusText,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      assetType: type,
      projectId,
      serverDetail,
    });

    throw new Error(`Failed to upload asset: ${serverDetail || response.statusText}`);
  }
  const result = await response.json();
  return {
    asset: mapAsset(result.asset),
    storageUrl: result.storage_url ?? result.storageUrl ?? result.asset?.storage_url,
  };
}

export async function deleteAsset(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/assets/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to delete asset');
  }
  return response.json();
}

// ==================== Screenshot Config ====================

export async function getScreenshotConfig(
  projectId: string
): Promise<{
  aiRaw?: AiLayerTreeConfig;
  userEdited?: AiLayerTreeConfig;
  exportedPngs?: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/screenshot-config`);
  if (!response.ok) {
    throw await readApiError(response, 'Failed to fetch screenshot config');
  }
  return response.json();
}

export async function saveScreenshotConfig(
  projectId: string,
  config: AiLayerTreeConfig,
  version: 'ai_original' | 'user_edited'
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/screenshot-config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ project_id: projectId, config, version }),
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to save screenshot config');
  }
  return response.json();
}

export async function generateScreenshotWithAI(
  projectId: string,
  prompt: string
): Promise<{ config: AiLayerTreeConfig }> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/screenshot/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to generate screenshot with AI');
  }
  return response.json();
}

export async function validateScreenshotExportAccess(
  projectId: string
): Promise<{ success: boolean; entitlementSummary?: ProjectEntitlementSummary }> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/screenshot/export-check`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to validate screenshot export access');
  }
  const data = await response.json();
  return {
    success: Boolean(data.success),
    entitlementSummary: data.entitlement_summary ? mapEntitlementSummary(data.entitlement_summary) : undefined,
  };
}

// ==================== Policy Site ====================

export async function getPolicySite(projectId: string): Promise<{
  policySite?: PolicySiteConfig;
  privacyUrl?: string;
  termsUrl?: string;
  entitlementSummary?: ProjectEntitlementSummary;
}> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/projects/${projectId}/policy-site`);
  if (!response.ok) {
    throw await readApiError(response, 'Failed to fetch policy site');
  }
  const data = await response.json();
  return {
    policySite: data.policy_site ? mapPolicySiteConfig(data.policy_site) : undefined,
    privacyUrl: data.privacy_url,
    termsUrl: data.terms_url,
    entitlementSummary: data.entitlement_summary ? mapEntitlementSummary(data.entitlement_summary) : undefined,
  };
}

export async function previewPolicySite(
  projectId: string,
  answers: PolicyQuestionAnswers,
  localeDefault: PolicyLocale = 'en'
): Promise<{ renderData: PolicyPublicData['renderData'] }> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/policy-site/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locale_default: localeDefault,
      answers: toBackendPolicyAnswers(answers),
    }),
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to preview policy site');
  }
  const data = await response.json();
  return {
    renderData: mapPolicyRenderData(data.render_data),
  };
}

export async function generatePolicySite(
  projectId: string,
  answers: PolicyQuestionAnswers,
  localeDefault: PolicyLocale = 'en'
): Promise<{
  success: boolean;
  policySite: PolicySiteConfig;
  privacyUrl: string;
  termsUrl: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/policy-site/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locale_default: localeDefault,
      answers: toBackendPolicyAnswers(answers),
    }),
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to generate policy site');
  }
  const data = await response.json();
  return {
    success: Boolean(data.success),
    policySite: mapPolicySiteConfig(data.policy_site),
    privacyUrl: data.privacy_url,
    termsUrl: data.terms_url,
  };
}

export async function updatePolicySite(
  projectId: string,
  answers: PolicyQuestionAnswers,
  localeDefault: PolicyLocale = 'en'
): Promise<{
  success: boolean;
  policySite: PolicySiteConfig;
  privacyUrl: string;
  termsUrl: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/policy-site`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locale_default: localeDefault,
      answers: toBackendPolicyAnswers(answers),
    }),
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to update policy site');
  }
  const data = await response.json();
  return {
    success: Boolean(data.success),
    policySite: mapPolicySiteConfig(data.policy_site),
    privacyUrl: data.privacy_url,
    termsUrl: data.terms_url,
  };
}

export async function getPublicPolicyData(projectId: string): Promise<PolicyPublicData> {
  const response = await fetch(`${API_BASE_URL}/api/p/${projectId}/policy-data`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to fetch public policy data');
  }
  const data = await response.json();
  return {
    projectId: data.project_id,
    appName: data.app_name,
    localeDefault: data.locale_default,
    privacyUrl: data.privacy_url,
    termsUrl: data.terms_url,
    renderData: mapPolicyRenderData(data.render_data),
    entitlementSummary: data.entitlement_summary ? mapEntitlementSummary(data.entitlement_summary) : undefined,
    updatedAt: data.updated_at,
  };
}

export async function createProjectCheckoutSession(
  projectId: string,
  planCode: Exclude<PlanCode, 'free'>
): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_code: planCode }),
  });
  if (!response.ok) {
    throw await readApiError(response, 'Failed to create checkout session');
  }
  const data = await response.json();
  return {
    checkoutUrl: data.checkout_url,
    sessionId: data.session_id,
    planCode: data.plan_code,
  };
}
