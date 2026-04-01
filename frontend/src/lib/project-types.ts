// Project and Asset type definitions

import type { AiLayerTreeConfig } from './layer-tree-types';

export interface Project {
  id: string;
  name: string;
  description: string;
  deviceType: string;
  createdAt: string;
  updatedAt: string;
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

// Re-export LayerTree types for convenience
export type { AiLayerTreeConfig, Layer, SlideConfig } from './layer-tree-types';
