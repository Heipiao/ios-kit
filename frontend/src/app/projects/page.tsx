"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Smartphone, Trash2, ExternalLink } from "lucide-react";
import { getProjects, deleteProject, type Project } from "@/lib/api-projects";
import { BrandLogo } from "@/components/BrandLogo";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProjects();

    function handleWindowFocus() {
      void loadProjects();
    }

    function handlePageShow() {
      void loadProjects();
    }

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError("Failed to load projects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
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
          <p className="text-sm font-mono uppercase tracking-wider">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <BrandLogo
              markClassName="w-10 h-10 bg-transparent"
              titleClassName="text-xl font-display font-bold uppercase tracking-wider"
              subtitle="Projects"
              subtitleClassName="text-xs font-mono uppercase tracking-widest text-gray-500"
            />
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-black text-white hover:bg-red-500 transition-colors text-sm font-bold uppercase"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
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

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 border-2 border-black bg-gray-100 mx-auto mb-6 flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-2">No Projects Yet</h2>
            <p className="text-sm text-gray-500 mb-6">Create your first project to start generating App Store screenshots</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black bg-black text-white hover:bg-red-500 transition-colors text-sm font-bold uppercase"
            >
              <Plus className="w-4 h-4" />
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => handleDelete(project.id, project.name)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const deviceLabels: Record<string, string> = {
    iphone_65: "iPhone 6.5\"",
    iphone_67: "iPhone 6.7\"",
    iphone_55: "iPhone 5.5\"",
    ipad_129: "iPad 12.9\"",
    ipad_11: "iPad 11\"",
    ipad_109: "iPad 10.9\"",
  };

  const deviceLabel = project.deviceType
    ? deviceLabels[project.deviceType] || project.deviceType
    : "Device not set";

  return (
    <div className="border-2 border-black bg-white p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold uppercase tracking-wider text-lg truncate">{project.name}</h3>
          <p className="text-xs font-mono text-gray-500 mt-1 truncate">{project.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-1 border border-black bg-gray-50 text-xs font-mono uppercase">
          {deviceLabel}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-4">
        <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-yellow-50 transition-colors text-sm font-bold uppercase"
        >
          <ExternalLink className="w-4 h-4" />
          View
        </Link>
        <Link
          href={`/projects/${project.id}/screenshots`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-black text-white hover:bg-red-500 transition-colors text-sm font-bold uppercase"
        >
          <Smartphone className="w-4 h-4" />
          Edit Screenshots
        </Link>
        <button
          onClick={onDelete}
          className="p-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
          title="Delete project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
