"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Smartphone, ImagePlus, Edit3, Trash2, ExternalLink } from "lucide-react";
import { getProject, deleteProject, type Project, type Asset } from "@/lib/api-projects";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    } catch (err) {
      setError("Failed to load project");
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

  if (!project || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-mono text-red-600 mb-4">{error || "Project not found"}</p>
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

  const deviceLabels: Record<string, string> = {
    iphone_65: "iPhone 6.5\"",
    iphone_67: "iPhone 6.7\"",
    iphone_55: "iPhone 5.5\"",
    ipad_129: "iPad 12.9\"",
    ipad_11: "iPad 11\"",
    ipad_109: "iPad 10.9\"",
  };

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold uppercase tracking-wider">{project.name}</h1>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
                  {deviceLabels[project.deviceType] || project.deviceType}
                </p>
              </div>
            </div>
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
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Project Info */}
          <div className="md:col-span-1 space-y-6">
            {/* Description */}
            <section className="bg-white border-2 border-black p-4">
              <h2 className="font-display font-bold uppercase tracking-wider text-sm mb-2">Description</h2>
              <p className="text-sm leading-relaxed">{project.description || "No description"}</p>
            </section>

            {/* Actions */}
            <section className="space-y-2">
              <Link
                href={`/projects/${projectId}/screenshots`}
                className="flex items-center justify-between w-full px-4 py-3 border-2 border-black bg-black text-white hover:bg-red-500 transition-colors font-bold uppercase text-sm"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Edit Screenshots
                </div>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href={`/projects/${projectId}/metadata`}
                className="flex items-center justify-between w-full px-4 py-3 border-2 border-black bg-white hover:bg-yellow-50 transition-colors font-bold uppercase text-sm"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  App Metadata
                </div>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href={`/projects/${projectId}/privacy`}
                className="flex items-center justify-between w-full px-4 py-3 border-2 border-black bg-white hover:bg-yellow-50 transition-colors font-bold uppercase text-sm"
              >
                <div className="flex items-center gap-2">
                  <ImagePlus className="w-4 h-4" />
                  Privacy Policy
                </div>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </section>
          </div>

          {/* Right: Assets */}
          <div className="md:col-span-2">
            {/* Screenshots */}
            <section className="bg-white border-2 border-black p-4 mb-6">
              <h2 className="font-display font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                <ImagePlus className="w-4 h-4" />
                Screenshots ({screenshots.length})
              </h2>
              {screenshots.length === 0 ? (
                <p className="text-sm text-gray-500 font-mono">No screenshots uploaded</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {screenshots.map((screenshot, index) => (
                    <div key={screenshot.id} className="relative border-2 border-black bg-gray-50">
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
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Logo */}
            <section className="bg-white border-2 border-black p-4">
              <h2 className="font-display font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                <ImagePlus className="w-4 h-4" />
                App Logo
              </h2>
              {logo ? (
                <div className="w-32 h-32 border-2 border-black bg-gray-50 overflow-hidden">
                  <img
                    src={logo.storageUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500 font-mono">No logo uploaded</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
