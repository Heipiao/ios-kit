// Project and Asset type definitions

import type { AiLayerTreeConfig } from './layer-tree-types';

export interface Project {
  id: string;
  name: string;
  description: string;
  deviceType?: string;
  createdAt: string;
  updatedAt: string;
  entitlementSummary?: ProjectEntitlementSummary;
}

export interface Asset {
  id: string;
  projectId: string;
  type: 'screenshot' | 'logo' | 'other';
  storageUrl: string;
  filename: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface ScreenshotConfig {
  id: string;
  projectId: string;
  version: 'ai_original' | 'user_edited';
  config: AiLayerTreeConfig;
  exportedPngUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export type PlanCode = 'free' | 'base' | 'pro';
export type EntitlementStatus = 'inactive' | 'active' | 'revoked';

export interface ProjectEntitlementSummary {
  planCode: PlanCode;
  status: EntitlementStatus;
  screenshotHdExportEnabled: boolean;
  screenshotExportEnabled: boolean;
  screenshotMultiversionEnabled: boolean;
  screenshotMultilingualEnabled: boolean;
  policyPublishEnabled: boolean;
  policyMultilingualEnabled: boolean;
  policyHostingEnabled: boolean;
  aiQuotaTotal?: number | null;
  aiQuotaUsed: number;
  aiQuotaRemaining?: number | null;
  canUpgradeToBase: boolean;
  canUpgradeToPro: boolean;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
  planCode: Exclude<PlanCode, 'free'>;
}

export interface BillingErrorDetail {
  code?: string;
  message?: string;
  featureKey?: string;
  targetPlan?: Exclude<PlanCode, 'free'>;
}

export type PolicyLocale = 'en' | 'zh';

export type PolicyDataType =
  | 'contact_info'
  | 'user_content'
  | 'identifiers'
  | 'usage_data'
  | 'purchase_info'
  | 'diagnostics'
  | 'none';

export type PolicyThirdPartyService =
  | 'firebase'
  | 'supabase'
  | 'openai'
  | 'anthropic'
  | 'stripe'
  | 'revenuecat'
  | 'other'
  | 'none';

export interface PolicyQuestionAnswers {
  appName: string;
  companyName: string;
  supportEmail: string;
  websiteUrl?: string;
  effectiveDate: string;
  hasAccountCreation: boolean;
  collectsPersonalData: boolean;
  dataTypes: PolicyDataType[];
  usesThirdPartyServices: PolicyThirdPartyService[];
  allowsAccountDeletion: boolean;
  countriesOrRegionScope: string;
}

export interface PolicyDocumentSection {
  heading: string;
  paragraphs: string[];
  bullets: string[];
}

export interface PolicyDocumentRender {
  title: string;
  effectiveDateLabel: string;
  effectiveDateValue: string;
  intro?: string;
  sections: PolicyDocumentSection[];
  contactEmail?: string;
  websiteUrl?: string;
}

export interface PolicyRenderData {
  privacy: Record<PolicyLocale, PolicyDocumentRender>;
  terms: Record<PolicyLocale, PolicyDocumentRender>;
}

export interface PolicySiteConfig {
  id: string;
  projectId: string;
  version: string;
  localeDefault: PolicyLocale;
  answers: PolicyQuestionAnswers;
  renderData: PolicyRenderData;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicySiteSummary {
  published: boolean;
  updatedAt: string;
  privacyUrl: string;
  termsUrl: string;
}

export interface PolicyPublicData {
  projectId: string;
  appName: string;
  localeDefault: PolicyLocale;
  privacyUrl: string;
  termsUrl: string;
  renderData: PolicyRenderData;
  entitlementSummary?: ProjectEntitlementSummary;
  updatedAt: string;
}

// Re-export LayerTree types for convenience
export type { AiLayerTreeConfig, Layer, SlideConfig } from './layer-tree-types';
