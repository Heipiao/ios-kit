// Projects API client

export type { Project, Asset, ScreenshotConfig } from './project-types';
import { Project, Asset, ScreenshotConfig } from './project-types';
import { AiLayerTreeConfig } from './layer-tree-types';

const API_BASE_URL = process.env.PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ==================== Projects ====================

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects`);
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  const data = await response.json();
  return data.projects;
}

export async function getProject(id: string): Promise<{
  project: Project;
  assets: Asset[];
  screenshotConfig?: {
    aiRaw: AiLayerTreeConfig;
    userEdited: AiLayerTreeConfig;
    exportedPngs: string[];
  };
}> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }
  return response.json();
}

export async function createProject(data: {
  name: string;
  description: string;
  deviceType: string;
  screenshotIds: string[];
  logoId?: string;
}): Promise<{ project: Project; assets: Asset[] }> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return response.json();
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
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update project');
  }
  return response.json();
}

export async function deleteProject(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete project');
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
    throw new Error('Failed to upload asset');
  }
  return response.json();
}

export async function deleteAsset(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/assets/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete asset');
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
    throw new Error('Failed to fetch screenshot config');
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
    body: JSON.stringify({ config, version }),
  });
  if (!response.ok) {
    throw new Error('Failed to save screenshot config');
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
    throw new Error('Failed to generate screenshot with AI');
  }
  return response.json();
}
