"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Smartphone, ImagePlus, Trash2, ExternalLink, Upload, Save, ShieldCheck, X, Sparkles } from "lucide-react";
import {
  createProjectCheckoutSession,
  getProject,
  getAssetContentUrl,
  deleteProject,
  updateProject,
  uploadAsset,
  deleteAsset,
  saveScreenshotConfig,
  type Project,
  type Asset,
  type PolicySiteSummary,
  type ProjectEntitlementSummary,
} from "@/lib/api-projects";
import { BrandLogo } from "@/components/BrandLogo";
import { sanitizeConfigAssetRefs } from "@/lib/screenshot-editor";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [policySiteSummary, setPolicySiteSummary] = useState<PolicySiteSummary | null>(null);
  const [entitlementSummary, setEntitlementSummary] = useState<ProjectEntitlementSummary | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingNotice, setBillingNotice] = useState<string | null>(null);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<"base" | "pro" | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  async function loadProject() {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data.project);
      setAssets(data.assets);
      setPolicySiteSummary(data.policySiteSummary || null);
      setEntitlementSummary(data.entitlementSummary || null);
      setName(data.project.name);
      setDescription(data.project.description || "");
      setLoadError(null);
    } catch (err) {
      setLoadError("Failed to load project");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!project) return;

    if (!confirm(`Delete project "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      router.push("/projects");
    } catch (err) {
      alert("Failed to delete project");
      console.error(err);
    }
  }

  async function handleSaveProject() {
    try {
      setSaving(true);
      const result = await updateProject(projectId, {
        name: name.trim(),
        description: description.trim(),
      });
      setProject(result.project);
      setName(result.project.name);
      setDescription(result.project.description || "");
      setError(null);
    } catch (err) {
      setError("Failed to save project");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function refreshProjectAssets() {
    const data = await getProject(projectId);
    setProject(data.project);
    setAssets(data.assets);
    setPolicySiteSummary(data.policySiteSummary || null);
    setEntitlementSummary(data.entitlementSummary || null);
  }

  useEffect(() => {
    const checkoutState = searchParams.get("checkout");
    if (checkoutState === "success") {
      setBillingNotice("Checkout completed. Refreshing project plan status.");
      void loadProject();
    } else if (checkoutState === "cancelled") {
      setBillingNotice("Checkout was cancelled.");
    }
  }, [searchParams, projectId]);

  async function handleUploadScreenshots(files: File[]) {
    try {
      setUploadingScreenshot(true);
      setError(null);
      for (const file of files) {
        await uploadAsset(file, "screenshot", projectId);
      }
      await refreshProjectAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload screenshots");
      console.error(err);
    } finally {
      setUploadingScreenshot(false);
    }
  }

  async function handleUploadLogo(file: File) {
    try {
      setUploadingLogo(true);
      setError(null);
      const existingLogo = assets.find((asset) => asset.type === "logo");
      if (existingLogo) {
        await deleteAsset(existingLogo.id);
      }
      await uploadAsset(file, "logo", projectId);
      await refreshProjectAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
      console.error(err);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleDeleteScreenshot(assetId: string) {
    try {
      setError(null);
      await deleteAsset(assetId);
      const data = await getProject(projectId);
      if (data.screenshotConfig?.userEdited) {
        const sanitized = sanitizeConfigAssetRefs(
          data.screenshotConfig.userEdited,
          new Set(data.assets.map((asset) => asset.id)),
          { removedAssetId: assetId, removeOrphanSlides: true }
        );
        if (sanitized.changed) {
          try {
            await saveScreenshotConfig(projectId, sanitized.config, "user_edited");
          } catch (saveError) {
            console.error("[project] failed to save sanitized screenshot config after asset deletion", saveError);
            setError("Screenshot deleted, but the screenshots layout cleanup failed. Refresh once if the editor still shows the old asset.");
          }
        }
      }
      await refreshProjectAssets();
    } catch (err) {
      setError("Failed to delete screenshot");
      console.error(err);
    }
  }

  async function handleDeleteLogo(assetId: string) {
    try {
      await deleteAsset(assetId);
      await refreshProjectAssets();
    } catch (err) {
      setError("Failed to delete logo");
      console.error(err);
    }
  }

  async function handleUpgrade(planCode: "base" | "pro") {
    try {
      setCheckoutLoadingPlan(planCode);
      const session = await createProjectCheckoutSession(projectId, planCode);
      window.location.href = session.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setCheckoutLoadingPlan(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono uppercase tracking-wider">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project || loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-mono text-red-600 mb-4">{loadError || "Project not found"}</p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-yellow-50 transition-colors text-sm font-bold uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const screenshots = assets.filter((a) => a.type === "screenshot");
  const logo = assets.find((a) => a.type === "logo");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          <div className="flex items-center justify-between">
            <BrandLogo
              markClassName="w-10 h-10 bg-transparent"
              title={project.name}
              subtitle=""
              titleClassName="text-xl font-display font-bold uppercase tracking-wider"
              subtitleClassName="text-xs font-mono uppercase tracking-widest text-gray-500"
            />
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors text-sm font-bold uppercase"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 border-2 border-red-600 bg-red-50">
            <p className="text-sm font-mono text-red-600">{error}</p>
          </div>
        )}
        {billingNotice && (
          <div className="mb-6 p-4 border-2 border-black bg-yellow-100">
            <p className="text-sm font-mono text-black">{billingNotice}</p>
          </div>
        )}

        <div className="space-y-6">
          <section className="bg-white border-2 border-black p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Project Plan</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display font-bold uppercase tracking-wider text-2xl">
                    {(entitlementSummary?.planCode || "free").toUpperCase()}
                  </h2>
                  <span className="inline-flex border-2 border-black bg-gray-50 px-3 py-1 text-xs font-mono uppercase tracking-[0.22em]">
                    {project.name}
                  </span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!entitlementSummary?.canUpgradeToBase || checkoutLoadingPlan !== null}
                  onClick={() => handleUpgrade("base")}
                  className="inline-flex items-center justify-center gap-2 border-2 border-black bg-yellow-300 px-4 py-3 text-sm font-bold uppercase transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Sparkles className="w-4 h-4" />
                  {checkoutLoadingPlan === "base" ? "Redirecting..." : "Unlock Base"}
                </button>
                <button
                  type="button"
                  disabled={!entitlementSummary?.canUpgradeToPro || checkoutLoadingPlan !== null}
                  onClick={() => handleUpgrade("pro")}
                  className="inline-flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 text-sm font-bold uppercase text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Sparkles className="w-4 h-4" />
                  {checkoutLoadingPlan === "pro" ? "Redirecting..." : "Upgrade to Pro"}
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white border-2 border-black p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Basic Info</p>
                <h2 className="font-display font-bold uppercase tracking-wider text-2xl">Edit Project Details</h2>
                <p className="text-sm text-gray-600 mt-2 max-w-2xl">
                  This page is the project control panel. Update the app name and description here, then keep adding screenshots and logo assets as the project evolves.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveProject}
                disabled={saving || !name.trim()}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 border-2 text-sm font-bold uppercase transition-colors ${
                  saving || !name.trim()
                    ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-black bg-black text-white hover:bg-red-500"
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Project"}
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr,1.2fr]">
              <label className="block">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-1">
                  App Name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-black px-3 py-3 text-sm"
                  placeholder="Enter app name"
                />
              </label>

              <label className="block">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-1">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full border-2 border-black px-3 py-3 text-sm"
                  placeholder="Describe your app"
                />
              </label>
            </div>
          </section>

          <section className="bg-white border-2 border-black p-6">
            <div className="mb-6">
              <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Assets</p>
              <h2 className="font-display font-bold uppercase tracking-wider text-2xl">Manage Screenshots and Logo</h2>
              <p className="text-sm text-gray-600 mt-2">
                Upload more screenshots, replace the logo, or clean up assets before moving into screenshot composition.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
              <section className="border-2 border-black p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4 gap-4">
                  <h3 className="font-display font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    <ImagePlus className="w-4 h-4" />
                    Screenshots ({screenshots.length})
                  </h3>
                  <label className="inline-flex items-center gap-2 px-3 py-2 border-2 border-black bg-white hover:bg-yellow-50 transition-colors cursor-pointer text-xs font-bold uppercase">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length > 0) {
                          handleUploadScreenshots(files);
                        }
                        e.target.value = "";
                      }}
                    />
                    <Upload className="w-3 h-3" />
                    {uploadingScreenshot ? "Uploading..." : "Upload More"}
                  </label>
                </div>

                {screenshots.length === 0 ? (
                  <div className="border-2 border-dashed border-black p-8 text-center bg-white">
                    <p className="text-sm font-display uppercase">No screenshots yet</p>
                    <p className="text-xs font-mono text-gray-500 mt-2">
                      Upload screenshots here or use the screenshot flow from the new project page.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {screenshots.map((screenshot, index) => (
                      <div key={screenshot.id} className="relative border-2 border-black bg-white group">
                        <div className="aspect-[9/16] overflow-hidden">
                          <img
                            src={getAssetContentUrl(screenshot.id)}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-1 left-1 w-5 h-5 border-2 border-black bg-black text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteScreenshot(screenshot.id)}
                          className="absolute top-1 right-1 w-5 h-5 border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                          title="Delete screenshot"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="border-2 border-black p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4 gap-4">
                  <h3 className="font-display font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    <ImagePlus className="w-4 h-4" />
                    App Logo
                  </h3>
                  <label className="inline-flex items-center gap-2 px-3 py-2 border-2 border-black bg-white hover:bg-teal-50 transition-colors cursor-pointer text-xs font-bold uppercase">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadLogo(file);
                        }
                        e.target.value = "";
                      }}
                    />
                    <Upload className="w-3 h-3" />
                    {uploadingLogo ? "Uploading..." : logo ? "Replace" : "Upload"}
                  </label>
                </div>

                {logo ? (
                  <div className="relative inline-block border-2 border-black bg-white group">
                    <div className="w-40 h-40 overflow-hidden">
                      <img
                        src={getAssetContentUrl(logo.id)}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLogo(logo.id)}
                      className="absolute top-1 right-1 w-6 h-6 border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                      title="Delete logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-black p-8 text-center bg-white">
                    <p className="text-sm font-display uppercase">No logo uploaded</p>
                    <p className="text-xs font-mono text-gray-500 mt-2">
                      Upload a square app logo here and replace it any time.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </section>

          <section className="bg-white border-2 border-black p-6">
            <div className="mb-6">
              <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Next Steps</p>
              <h2 className="font-display font-bold uppercase tracking-wider text-2xl">Continue The Workflow</h2>
              <p className="text-sm text-gray-600 mt-2">
                Pick the next production step based on what you want to generate right now.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href={`/projects/${projectId}/screenshots`}
                className="flex items-center justify-between px-5 py-5 border-2 border-black bg-black text-white hover:bg-red-500 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4" />
                    <span className="font-display font-bold uppercase tracking-wider text-lg">Create Screenshots</span>
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-200">
                    {entitlementSummary?.screenshotHdExportEnabled
                      ? "Choose device size and export full-resolution App Store visuals."
                      : "Choose device size and compose visuals. Upgrade for HD export."}
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 shrink-0" />
              </Link>

              <Link
                href={`/projects/${projectId}/privacy`}
                className="flex items-center justify-between px-5 py-5 border-2 border-black bg-yellow-400 hover:bg-yellow-500 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-display font-bold uppercase tracking-wider text-lg">
                      {policySiteSummary ? "Edit Policy Site" : "Create Policy Site"}
                    </span>
                  </div>
                  <p className="text-xs font-mono uppercase tracking-wider text-gray-700">
                    {policySiteSummary
                      ? `Published ${new Date(policySiteSummary.updatedAt).toLocaleDateString()}`
                      : entitlementSummary?.policyPublishEnabled
                        ? "Generate one privacy page and one terms page for this project."
                        : "Edit drafts for free. Upgrade to publish and host."}
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 shrink-0" />
              </Link>

              {policySiteSummary ? (
                <div className="border-2 border-black bg-white px-5 py-5">
                  <div className="mb-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Policy URLs</p>
                    <p className="mt-2 text-sm text-gray-600">
                      This project has one published privacy page and one published terms page.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <a
                      href={policySiteSummary.privacyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between border-2 border-black px-4 py-3 text-xs font-bold uppercase transition-colors hover:bg-yellow-50"
                    >
                      Open Privacy
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={policySiteSummary.termsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between border-2 border-black px-4 py-3 text-xs font-bold uppercase transition-colors hover:bg-yellow-50"
                    >
                      Open Terms
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
