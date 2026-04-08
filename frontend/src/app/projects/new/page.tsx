"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, X, Smartphone, ArrowLeft, ImagePlus, ShieldCheck, Save } from "lucide-react";
import { createProject, uploadAsset, type Asset } from "@/lib/api-projects";
import { BrandLogo } from "@/components/BrandLogo";

export default function NewProjectPage() {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"screenshots" | "save" | "privacy" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [screenshots, setScreenshots] = useState<Asset[]>([]);
  const [logo, setLogo] = useState<Asset | null>(null);

  // Upload handlers
  const handleUploadScreenshot = async (file: File) => {
    try {
      const result = await uploadAsset(file, "screenshot");
      setScreenshots((prev) => [...prev, result.asset]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload screenshot");
      console.error(err);
    }
  };

  const handleUploadLogo = async (file: File) => {
    try {
      const result = await uploadAsset(file, "logo");
      setLogo(result.asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload logo");
      console.error(err);
    }
  };

  const handleRemoveScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRemoveLogo = () => {
    setLogo(null);
  };

  const createAndRoute = async (mode: "screenshots" | "save" | "privacy") => {
    if (!appName.trim()) {
      setError("App name is required");
      return;
    }

    if (mode === "screenshots" && screenshots.length === 0) {
      setError("Please upload at least one screenshot before creating screenshots");
      return;
    }

    try {
      setLoadingAction(mode);
      setError(null);

      const result = await createProject({
        name: appName.trim(),
        description: description.trim(),
        screenshotIds: screenshots.map((s) => s.id),
        logoId: logo?.id,
      });

      if (mode === "screenshots") {
        router.push(`/projects/${result.project.id}/screenshots`);
        return;
      }

      if (mode === "privacy") {
        router.push(`/projects/${result.project.id}/privacy`);
        return;
      }

      router.push(`/projects/${result.project.id}`);
    } catch (err) {
      setError("Failed to create project");
      console.error(err);
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          <BrandLogo
            markClassName="w-10 h-10 bg-transparent"
            title="Create New Project"
            subtitle="Enter app details and upload screenshots"
            titleClassName="text-xl font-display font-bold uppercase tracking-wider"
            subtitleClassName="text-xs font-mono uppercase tracking-widest text-gray-500"
          />
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 border-2 border-red-600 bg-red-50">
            <p className="text-sm font-mono text-red-600">{error}</p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAndRoute("save");
          }}
          className="space-y-8"
        >
          {/* Basic Info */}
          <section className="bg-white border-2 border-black p-6">
            <h2 className="font-display font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-1">
                  App Name *
                </span>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full border-2 border-black px-3 py-2 text-sm"
                  placeholder="Enter your app name"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-1">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-black px-3 py-2 text-sm"
                  placeholder="Describe your app's core value"
                />
              </label>
              <p className="text-xs font-mono uppercase tracking-wider text-gray-500">
                Device size will be selected later in the screenshot editor.
              </p>
            </div>
          </section>

          {/* Screenshots */}
          <section className="bg-white border-2 border-black p-6">
            <h2 className="font-display font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImagePlus className="w-5 h-5" />
              Screenshots
            </h2>

            <div className="space-y-4">
              {/* Upload Area */}
              <label className="block border-2 border-dashed border-black p-8 cursor-pointer hover:bg-yellow-50 transition-colors text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach(handleUploadScreenshot);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-display uppercase">Click to upload screenshots</p>
                <p className="text-xs font-mono text-gray-500 mt-1">PNG or JPG. Required only for the screenshot flow.</p>
              </label>

              {/* Uploaded Screenshots */}
              {screenshots.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {screenshots.map((screenshot, index) => (
                    <div
                      key={screenshot.id}
                      className="relative border-2 border-black bg-gray-50 group"
                    >
                      <div className="aspect-[9/16] overflow-hidden">
                        <img
                          src={screenshot.storageUrl}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-1 left-1 w-5 h-5 border-2 border-black bg-black text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreenshot(screenshot.id)}
                        className="absolute top-1 right-1 w-5 h-5 border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Logo (Optional) */}
          <section className="bg-white border-2 border-black p-6">
            <h2 className="font-display font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImagePlus className="w-5 h-5" />
              App Logo (Optional)
            </h2>

            {!logo ? (
              <label className="block border-2 border-dashed border-black p-6 cursor-pointer hover:bg-teal-50 transition-colors text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadLogo(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-display uppercase">Click to upload logo</p>
                <p className="text-xs font-mono text-gray-500 mt-1">PNG or JPG, recommended 1024x1024</p>
              </label>
            ) : (
              <div className="relative inline-block border-2 border-black bg-gray-50 group">
                <div className="w-32 h-32 overflow-hidden">
                  <img
                    src={logo.storageUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute top-1 right-1 w-6 h-6 border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="grid gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => createAndRoute("screenshots")}
              disabled={loadingAction !== null}
              className={`py-4 border-2 font-display font-bold uppercase tracking-wider transition-colors ${
                loadingAction !== null
                  ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-black bg-black text-white hover:bg-red-500"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <ImagePlus className="w-4 h-4" />
                {loadingAction === "screenshots" ? "Creating..." : "Create Screenshots"}
              </span>
            </button>

            <button
              type="submit"
              disabled={loadingAction !== null}
              className={`py-4 border-2 font-display font-bold uppercase tracking-wider transition-colors ${
                loadingAction !== null
                  ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-black bg-white hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {loadingAction === "save" ? "Saving..." : "Save Only"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => createAndRoute("privacy")}
              disabled={loadingAction !== null}
              className={`py-4 border-2 font-display font-bold uppercase tracking-wider transition-colors ${
                loadingAction !== null
                  ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-black bg-yellow-400 hover:bg-yellow-500"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {loadingAction === "privacy" ? "Creating..." : "Create Policy Site"}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-wider text-gray-500">
              You can also upload screenshots and logo later from the project page.
            </p>
            <Link
              href="/projects"
              className="px-6 py-3 border-2 border-black bg-white hover:bg-gray-100 transition-colors font-display font-bold uppercase tracking-wider"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
