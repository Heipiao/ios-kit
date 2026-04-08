"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, Globe2, Save, ShieldCheck } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import {
  ApiError,
  generatePolicySite,
  getPolicySite,
  getProject,
  updatePolicySite,
  type PolicyQuestionAnswers,
  type PolicySiteConfig,
  type ProjectEntitlementSummary,
  type Project,
} from "@/lib/api-projects";
import {
  createDefaultPolicyAnswers,
  POLICY_DATA_TYPE_OPTIONS,
  POLICY_SERVICE_OPTIONS,
  togglePolicyValue,
} from "@/lib/policy-site";

export default function ProjectPrivacyPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [policySite, setPolicySite] = useState<PolicySiteConfig | null>(null);
  const [entitlementSummary, setEntitlementSummary] = useState<ProjectEntitlementSummary | null>(null);
  const [answers, setAnswers] = useState<PolicyQuestionAnswers>(createDefaultPolicyAnswers());
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [termsUrl, setTermsUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywallPlan, setPaywallPlan] = useState<"base" | "pro" | null>(null);
  const [paywallFeature, setPaywallFeature] = useState("Policy publishing");

  useEffect(() => {
    void loadPage();
  }, [projectId]);

  async function loadPage() {
    try {
      setLoading(true);
      const [projectData, policyData] = await Promise.all([
        getProject(projectId),
        getPolicySite(projectId),
      ]);

      setProject(projectData.project);
      setPolicySite(policyData.policySite || null);
      setEntitlementSummary(policyData.entitlementSummary || projectData.entitlementSummary || null);
      setAnswers(policyData.policySite?.answers || createDefaultPolicyAnswers(projectData.project.name));
      setPrivacyUrl(policyData.privacyUrl || `/p/${projectId}/privacy`);
      setTermsUrl(policyData.termsUrl || `/p/${projectId}/terms`);
      setLoadError(null);
    } catch (err) {
      setLoadError("Failed to load policy site");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function setAnswer<K extends keyof PolicyQuestionAnswers>(key: K, value: PolicyQuestionAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function handleToggleDataType(value: PolicyQuestionAnswers["dataTypes"][number]) {
    setAnswers((current) => ({
      ...current,
      dataTypes: togglePolicyValue(current.dataTypes, value, "none"),
    }));
  }

  function handleToggleService(value: PolicyQuestionAnswers["usesThirdPartyServices"][number]) {
    setAnswers((current) => ({
      ...current,
      usesThirdPartyServices: togglePolicyValue(current.usesThirdPartyServices, value, "none"),
    }));
  }

  async function handleSubmit() {
    if (!project) {
      return;
    }

    if (!answers.appName.trim() || !answers.companyName.trim() || !answers.supportEmail.trim()) {
      setError("App name, company name, and support email are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const result = policySite
        ? await updatePolicySite(projectId, answers, "en")
        : await generatePolicySite(projectId, answers, "en");

      setPolicySite(result.policySite);
      setPrivacyUrl(result.privacyUrl);
      setTermsUrl(result.termsUrl);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402 && typeof err.detail === "object") {
        setPaywallPlan(err.detail.targetPlan || "base");
        setPaywallFeature(err.detail.message || "Policy publishing");
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate policy site");
      }
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const fullPrivacyUrl = useMemo(
    () => (privacyUrl ? `${siteOrigin}${privacyUrl}` : ""),
    [siteOrigin, privacyUrl]
  );
  const fullTermsUrl = useMemo(
    () => (termsUrl ? `${siteOrigin}${termsUrl}` : ""),
    [siteOrigin, termsUrl]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
          <p className="text-sm font-mono uppercase tracking-wider">Loading policy site...</p>
        </div>
      </div>
    );
  }

  if (!project || loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-sm font-mono text-red-600">{loadError || "Project not found"}</p>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase transition-colors hover:bg-yellow-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  const previewPrivacySections = policySite?.renderData.privacy.en.sections || [];
  const previewTermsSections = policySite?.renderData.terms.en.sections || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b-2 border-black bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link
            href={`/projects/${projectId}`}
            className="mb-2 inline-flex items-center gap-2 text-sm font-mono uppercase hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-gray-500">Policy Site</p>
              <h1 className="mt-2 text-3xl font-display font-bold uppercase tracking-wide">
                {project.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                {entitlementSummary?.policyPublishEnabled
                  ? "Answer a short review-focused questionnaire and publish one privacy page and one terms page for this project."
                  : "Answer the questionnaire for free, then upgrade to Base when you are ready to publish and host policy pages."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className={`inline-flex items-center gap-2 border-2 px-4 py-3 text-sm font-bold uppercase transition-colors ${
                saving
                  ? "border-gray-300 bg-gray-100 text-gray-400"
                  : "border-black bg-black text-white hover:bg-red-500"
              }`}
            >
              <Save className="h-4 w-4" />
              {saving ? "Generating..." : policySite ? "Save & Publish" : "Generate & Publish"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error ? (
          <div className="mb-6 border-2 border-red-600 bg-red-50 p-4">
            <p className="text-sm font-mono text-red-600">{error}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr),minmax(320px,0.9fr)]">
          <section className="space-y-6">
            <div className="border-2 border-black bg-white p-6">
              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-[0.22em] text-gray-500">Basics</p>
                <h2 className="mt-2 text-2xl font-display font-bold uppercase tracking-wide">
                  App Store Review Inputs
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-mono uppercase tracking-wider text-gray-500">
                    App Name
                  </span>
                  <input
                    type="text"
                    value={answers.appName}
                    onChange={(event) => setAnswer("appName", event.target.value)}
                    className="w-full border-2 border-black px-3 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-mono uppercase tracking-wider text-gray-500">
                    Company Name
                  </span>
                  <input
                    type="text"
                    value={answers.companyName}
                    onChange={(event) => setAnswer("companyName", event.target.value)}
                    className="w-full border-2 border-black px-3 py-3 text-sm"
                    placeholder="Legal entity or publisher name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-mono uppercase tracking-wider text-gray-500">
                    Support Email
                  </span>
                  <input
                    type="email"
                    value={answers.supportEmail}
                    onChange={(event) => setAnswer("supportEmail", event.target.value)}
                    className="w-full border-2 border-black px-3 py-3 text-sm"
                    placeholder="support@example.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-mono uppercase tracking-wider text-gray-500">
                    Website URL
                  </span>
                  <input
                    type="url"
                    value={answers.websiteUrl || ""}
                    onChange={(event) => setAnswer("websiteUrl", event.target.value)}
                    className="w-full border-2 border-black px-3 py-3 text-sm"
                    placeholder="https://example.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-mono uppercase tracking-wider text-gray-500">
                    Effective Date
                  </span>
                  <input
                    type="date"
                    value={answers.effectiveDate}
                    onChange={(event) => setAnswer("effectiveDate", event.target.value)}
                    className="w-full border-2 border-black px-3 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-mono uppercase tracking-wider text-gray-500">
                    Region Scope
                  </span>
                  <input
                    type="text"
                    value={answers.countriesOrRegionScope}
                    onChange={(event) => setAnswer("countriesOrRegionScope", event.target.value)}
                    className="w-full border-2 border-black px-3 py-3 text-sm"
                    placeholder="Worldwide"
                  />
                </label>
              </div>
            </div>

            <div className="border-2 border-black bg-white p-6">
              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-[0.22em] text-gray-500">Questions</p>
                <h2 className="mt-2 text-2xl font-display font-bold uppercase tracking-wide">
                  Data and Account Behavior
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <ToggleCard
                    title="Does the app create user accounts?"
                    value={answers.hasAccountCreation}
                    onChange={(value) => {
                      setAnswer("hasAccountCreation", value);
                      if (!value) {
                        setAnswer("allowsAccountDeletion", false);
                      }
                    }}
                  />
                  <ToggleCard
                    title="Does the app collect personal data?"
                    value={answers.collectsPersonalData}
                    onChange={(value) => {
                      setAnswer("collectsPersonalData", value);
                      if (!value) {
                        setAnswer("dataTypes", ["none"]);
                      }
                    }}
                  />
                  <ToggleCard
                    title="Can the user request account deletion?"
                    value={answers.allowsAccountDeletion}
                    disabled={!answers.hasAccountCreation}
                    onChange={(value) => setAnswer("allowsAccountDeletion", value)}
                  />
                </div>

                <div className="space-y-5">
                  <fieldset>
                    <legend className="mb-2 text-xs font-mono uppercase tracking-wider text-gray-500">
                      What data categories apply?
                    </legend>
                    <div className="space-y-2">
                      {POLICY_DATA_TYPE_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={answers.dataTypes.includes(option.value)}
                            disabled={!answers.collectsPersonalData && option.value !== "none"}
                            onChange={() => handleToggleDataType(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-2 text-xs font-mono uppercase tracking-wider text-gray-500">
                      Which third-party services are used?
                    </legend>
                    <div className="space-y-2">
                      {POLICY_SERVICE_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={answers.usesThirdPartyServices.includes(option.value)}
                            onChange={() => handleToggleService(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            {policySite ? (
              <>
                <div className="border-2 border-black bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Globe2 className="h-4 w-4" />
                    <h2 className="font-display text-lg font-bold uppercase tracking-wide">Published URLs</h2>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="mb-1 text-xs font-mono uppercase tracking-wider text-gray-500">Privacy</p>
                      <p className="break-all text-gray-700">{fullPrivacyUrl || privacyUrl}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-mono uppercase tracking-wider text-gray-500">Terms</p>
                      <p className="break-all text-gray-700">{fullTermsUrl || termsUrl}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href={privacyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between border-2 border-black px-4 py-3 text-sm font-bold uppercase transition-colors hover:bg-yellow-50"
                    >
                      Open Privacy
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={termsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between border-2 border-black px-4 py-3 text-sm font-bold uppercase transition-colors hover:bg-yellow-50"
                    >
                      Open Terms
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <p className="text-xs font-mono uppercase tracking-wider text-gray-500">
                      Updated {new Date(policySite.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-2 border-black bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <h2 className="font-display text-lg font-bold uppercase tracking-wide">Privacy Structure</h2>
                  </div>
                  <ol className="space-y-2 text-sm text-gray-700">
                    {previewPrivacySections.map((section, index) => (
                      <li key={section.heading}>
                        <span className="mr-2 font-mono text-xs uppercase text-gray-400">{index + 1}</span>
                        {section.heading}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="border-2 border-black bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h2 className="font-display text-lg font-bold uppercase tracking-wide">Terms Structure</h2>
                  </div>
                  <ol className="space-y-2 text-sm text-gray-700">
                    {previewTermsSections.map((section, index) => (
                      <li key={section.heading}>
                        <span className="mr-2 font-mono text-xs uppercase text-gray-400">{index + 1}</span>
                        {section.heading}
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : (
              <div className="border-2 border-black bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide">First Generate</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Generate once to publish the project’s single privacy page and terms page. URLs and document structure will appear here after the first successful run.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      <PaywallModal
        open={paywallPlan !== null && entitlementSummary !== null}
        projectId={projectId}
        currentPlan={entitlementSummary?.planCode || "free"}
        targetPlan={paywallPlan || "base"}
        featureName={paywallFeature}
        onClose={() => setPaywallPlan(null)}
      />
    </div>
  );
}

function ToggleCard({
  title,
  value,
  onChange,
  disabled = false,
}: {
  title: string;
  value: boolean;
  onChange: (nextValue: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`border-2 border-black p-4 ${disabled ? "bg-gray-100" : "bg-gray-50"}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className={`text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-800"}`}>{title}</p>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-mono uppercase tracking-wider ${
            value ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(true)}
          className={`flex-1 border-2 px-3 py-2 text-xs font-bold uppercase transition-colors ${
            disabled
              ? "border-gray-300 bg-gray-100 text-gray-400"
              : value
                ? "border-black bg-black text-white"
                : "border-black bg-white hover:bg-yellow-50"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`flex-1 border-2 px-3 py-2 text-xs font-bold uppercase transition-colors ${
            disabled
              ? "border-gray-300 bg-gray-100 text-gray-400"
              : !value
                ? "border-black bg-black text-white"
                : "border-black bg-white hover:bg-yellow-50"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}
