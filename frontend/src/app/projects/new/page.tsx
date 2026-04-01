"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, X, Smartphone, ArrowLeft, ImagePlus } from "lucide-react";
import { createProject, uploadAsset, type Asset } from "@/lib/api-projects";

const DEVICE_PRESETS = [
  { value: "iphone_67", label: "iPhone 6.7\"", desc: "1290 x 2796" },
  { value: "iphone_65", label: "iPhone 6.5\"", desc: "1284 x 2778" },
  { value: "iphone_55", label: "iPhone 5.5\"", desc: "1242 x 2208" },
  { value: "ipad_129", label: "iPad 12.9\"", desc: "2048 x 2732" },
  { value: "ipad_11", label: "iPad 11\"", desc: "1668 x 2388" },
  { value: "ipad_109", label: "iPad 10.9\"", desc: "1640 x 2360" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [deviceType, setDeviceType] = useState("iphone_67");
  const [screenshots, setScreenshots] = useState<Asset[]>([]);
  const [logo, setLogo] = useState<Asset | null>(null);

  // Upload handlers
  const handleUploadScreenshot = async (file: File) => {
    try {
      const result = await uploadAsset(file, "screenshot");
      setScreenshots((prev) => [...prev, result.asset]);
    } catch (err) {
      setError("Failed to upload screenshot");
      console.error(err);
    }
  };

  const handleUploadLogo = async (file: File) => {
    try {
      const result = await uploadAsset(file, "logo");
      setLogo(result.asset);
    } catch (err) {
      setError("Failed to upload logo");
      console.error(err);
    }
  };

  const handleRemoveScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRemoveLogo = () => {
    setLogo(null);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appName.trim()) {
      setError("App name is required");
      return;
    }

    if (screenshots.length === 0) {
      setError("Please upload at least one screenshot");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await createProject({
        name: appName.trim(),
        description: description.trim(),
        deviceType,
        screenshotIds: screenshots.map((s) => s.id),
        logoId: logo?.id,
      });

      // Navigate to project page
      router.push(`/projects/${result.project.id}`);
    } catch (err) {
      setError("Failed to create project");
      console.error(err);
      setLoading(false);
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold uppercase tracking-wider">Create New Project</h1>
              <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
                Enter app details and upload screenshots
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 border-2 border-red-600 bg-red-50">
            <p className="text-sm font-mono text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
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

              <label className="block">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-2">
                  Target Device *
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {DEVICE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setDeviceType(preset.value)}
                      className={`p-3 border-2 text-left transition-colors ${
                        deviceType === preset.value
                          ? "border-black bg-black text-white"
                          : "border-black bg-gray-50 hover:bg-yellow-50"
                      }`}
                    >
                      <div className="font-bold text-sm uppercase">{preset.label}</div>
                      <div className={`text-xs font-mono ${
                        deviceType === preset.value ? "text-gray-300" : "text-gray-500"
                      }`}>
                        {preset.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </section>

          {/* Screenshots */}
          <section className="bg-white border-2 border-black p-6">
            <h2 className="font-display font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <ImagePlus className="w-5 h-5" />
              Screenshots *
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
                <p className="text-xs font-mono text-gray-500 mt-1">PNG or JPG, at least one required</p>
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
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 border-2 font-display font-bold uppercase tracking-wider transition-colors ${
                loading
                  ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-black bg-black text-white hover:bg-red-500"
              }`}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
            <Link
              href="/projects"
              className="px-6 py-4 border-2 border-black bg-white hover:bg-gray-100 transition-colors font-display font-bold uppercase tracking-wider"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
