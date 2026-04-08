import type {
  PolicyLocale,
  PolicyPublicData,
  PolicyDocumentRender,
} from "./project-types";

export function resolvePolicyLocale(
  preferred: string | undefined,
  fallback: PolicyLocale
): PolicyLocale {
  return preferred === "zh" ? "zh" : fallback;
}

export function getPolicyDocument(
  publicData: PolicyPublicData,
  documentType: "privacy" | "terms",
  locale: PolicyLocale
): PolicyDocumentRender {
  return publicData.renderData[documentType][locale];
}
