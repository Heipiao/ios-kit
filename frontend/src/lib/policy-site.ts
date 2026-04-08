import type { PolicyDataType, PolicyQuestionAnswers, PolicyThirdPartyService } from "./project-types";

export const POLICY_DATA_TYPE_OPTIONS: Array<{ value: PolicyDataType; label: string }> = [
  { value: "contact_info", label: "Contact info" },
  { value: "user_content", label: "User content" },
  { value: "identifiers", label: "Identifiers" },
  { value: "usage_data", label: "Usage data" },
  { value: "purchase_info", label: "Purchase info" },
  { value: "diagnostics", label: "Diagnostics" },
  { value: "none", label: "No personal data" },
];

export const POLICY_SERVICE_OPTIONS: Array<{ value: PolicyThirdPartyService; label: string }> = [
  { value: "firebase", label: "Firebase" },
  { value: "supabase", label: "Supabase" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "stripe", label: "Stripe" },
  { value: "revenuecat", label: "RevenueCat" },
  { value: "other", label: "Other providers" },
  { value: "none", label: "None" },
];

export function createDefaultPolicyAnswers(appName = ""): PolicyQuestionAnswers {
  return {
    appName,
    companyName: "",
    supportEmail: "",
    websiteUrl: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    hasAccountCreation: false,
    collectsPersonalData: false,
    dataTypes: ["none"],
    usesThirdPartyServices: ["none"],
    allowsAccountDeletion: false,
    countriesOrRegionScope: "Worldwide",
  };
}

export function togglePolicyValue<T extends string>(values: T[], nextValue: T, noneValue: T): T[] {
  if (nextValue === noneValue) {
    return [noneValue];
  }

  const nextSet = new Set(values.filter((value) => value !== noneValue));
  if (nextSet.has(nextValue)) {
    nextSet.delete(nextValue);
  } else {
    nextSet.add(nextValue);
  }

  return nextSet.size > 0 ? Array.from(nextSet) : [noneValue];
}
