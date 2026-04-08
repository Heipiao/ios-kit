"use client";

import { DEFAULT_DEVICE_FRAME_ASSET_ID, getDeviceFrameAsset } from "./device-frame-assets";
import { generateId } from "./layer-tree-mock";
import type { AiLayerTreeConfig, DeviceLayer, ImageLayer, Layer } from "./layer-tree-types";

export interface ScreenshotAsset {
  id: string;
  name: string;
  previewUrl: string;
  sourceUrl: string;
  width: number;
  height: number;
}

export interface LayerAssetDebugInfo {
  layerId: string;
  layerType: string;
  assetRef: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  visible: boolean;
  previewUrl: string;
  sourceUrl: string;
  resolvedUrl?: string;
  loadState: "pending" | "loaded" | "failed";
  loadedWidth?: number;
  loadedHeight?: number;
  error?: string;
}

export type DeviceType = "iphone_65" | "iphone_67" | "iphone_55" | "ipad_129" | "ipad_11" | "ipad_109";

export const BASE_EXPORT_SIZE = { w: 1206, h: 2622 };

export const DEVICE_PRESETS: Record<DeviceType, { label: string; exportSize: { w: number; h: number } }> = {
  iphone_67: { label: 'iPhone 6.7"', exportSize: { w: 1290, h: 2796 } },
  iphone_65: { label: 'iPhone 6.5"', exportSize: { w: 1284, h: 2778 } },
  iphone_55: { label: 'iPhone 5.5"', exportSize: { w: 1242, h: 2208 } },
  ipad_129: { label: 'iPad 12.9"', exportSize: { w: 2048, h: 2732 } },
  ipad_11: { label: 'iPad 11"', exportSize: { w: 1668, h: 2388 } },
  ipad_109: { label: 'iPad 10.9"', exportSize: { w: 1640, h: 2360 } },
};

function defaultDeviceRenderMode(deviceType: DeviceType) {
  return deviceType.startsWith("iphone_") ? "frame-asset" as const : "screenshot-only" as const;
}

function fitSizeToBox(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
  fallbackWidth: number,
  fallbackHeight: number,
  allowUpscale = false
) {
  if (sourceWidth <= 0 || sourceHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: fallbackWidth, height: fallbackHeight };
  }

  const rawScale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  const scale = allowUpscale ? rawScale : Math.min(1, rawScale);
  return {
    width: Math.max(10, Math.round(sourceWidth * scale)),
    height: Math.max(10, Math.round(sourceHeight * scale)),
  };
}

function fitAspectRatioToBox(
  aspectRatio: number,
  maxWidth: number,
  maxHeight: number,
  fallbackWidth: number,
  fallbackHeight: number
) {
  if (aspectRatio <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: fallbackWidth, height: fallbackHeight };
  }

  const widthFromHeight = maxHeight * aspectRatio;
  if (widthFromHeight <= maxWidth) {
    return {
      width: Math.max(10, Math.round(widthFromHeight)),
      height: Math.max(10, Math.round(maxHeight)),
    };
  }

  return {
    width: Math.max(10, Math.round(maxWidth)),
    height: Math.max(10, Math.round(maxWidth / aspectRatio)),
  };
}

export function applyAssetToLayerFrame(
  layer: DeviceLayer | ImageLayer,
  asset: ScreenshotAsset,
  canvasSize: { w: number; h: number }
) {
  const layerMaxWidth = layer.type === "device"
    ? canvasSize.w * 0.55
    : canvasSize.w * 0.5;
  const layerMaxHeight = layer.type === "device"
    ? canvasSize.h * 0.65
    : canvasSize.h * 0.5;
  const nextSize = layer.type === "device" && layer.renderMode === "frame-asset"
    ? (() => {
        const frameAsset = getDeviceFrameAsset(layer.frameAssetId || DEFAULT_DEVICE_FRAME_ASSET_ID);
        if (!frameAsset) {
          return fitSizeToBox(
            asset.width,
            asset.height,
            layerMaxWidth,
            layerMaxHeight,
            layer.width,
            layer.height
          );
        }

        return fitAspectRatioToBox(
          frameAsset.outerSize.w / frameAsset.outerSize.h,
          layerMaxWidth,
          layerMaxHeight,
          layer.width,
          layer.height
        );
      })()
    : fitSizeToBox(
        asset.width,
        asset.height,
        layerMaxWidth,
        layerMaxHeight,
        layer.width,
        layer.height
      );
  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;

  return {
    ...layer,
    assetRef: asset.id,
    width: nextSize.width,
    height: nextSize.height,
    x: Math.round(centerX - nextSize.width / 2),
    y: Math.round(centerY - nextSize.height / 2),
  };
}

export function scaleLayer(layer: Layer, scaleX: number, scaleY: number, canvasWidth: number, canvasHeight: number): Layer {
  if (layer.type === "background") {
    return {
      ...layer,
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
    };
  }

  if (layer.type === "text") {
    return {
      ...layer,
      x: Math.round(layer.x * scaleX),
      y: Math.round(layer.y * scaleY),
      width: Math.round(layer.width * scaleX),
      height: Math.round(layer.height * scaleY),
      fontSize: Math.max(20, Math.round(layer.fontSize * Math.min(scaleX, scaleY))),
    };
  }

  if (layer.type === "image") {
    return {
      ...layer,
      x: Math.round(layer.x * scaleX),
      y: Math.round(layer.y * scaleY),
      width: Math.round(layer.width * scaleX),
      height: Math.round(layer.height * scaleY),
      cornerRadius: layer.cornerRadius ? Math.max(0, Math.round(layer.cornerRadius * Math.min(scaleX, scaleY))) : 0,
    };
  }

  return {
    ...layer,
    x: Math.round(layer.x * scaleX),
    y: Math.round(layer.y * scaleY),
    width: Math.round(layer.width * scaleX),
    height: Math.round(layer.height * scaleY),
  };
}

export function createSlideForDevice(
  projectName: string,
  slideNumber: number,
  deviceType: DeviceType,
  screenshotAsset?: ScreenshotAsset
) {
  const exportSize = DEVICE_PRESETS[deviceType].exportSize;
  const scaleX = exportSize.w / BASE_EXPORT_SIZE.w;
  const scaleY = exportSize.h / BASE_EXPORT_SIZE.h;
  const deviceLayer: DeviceLayer = {
    id: generateId("device"),
    type: "device",
    visible: true,
    zIndex: 1,
    x: Math.round(382 * scaleX),
    y: Math.round(355 * scaleY),
    width: Math.round(442 * scaleX),
    height: Math.round(908 * scaleY),
    assetRef: screenshotAsset?.id || "",
    renderMode: defaultDeviceRenderMode(deviceType),
    frameAssetId: DEFAULT_DEVICE_FRAME_ASSET_ID,
    borderColor: "#111111",
    cornerRadius: Math.round(60 * Math.min(scaleX, scaleY)),
    borderWidth: Math.max(6, Math.round(12 * Math.min(scaleX, scaleY))),
  };

  return {
    slideId: generateId("slide"),
    name: `${projectName} - Screen ${slideNumber}`,
    layers: [
      {
        id: generateId("bg"),
        type: "background" as const,
        visible: true,
        zIndex: 0,
        x: 0,
        y: 0,
        width: exportSize.w,
        height: exportSize.h,
        bgType: "gradient" as const,
        gradient: {
          type: "linear" as const,
          stops: [
            { offset: 0, color: "#667eea" },
            { offset: 1, color: "#764ba2" },
          ],
        },
      },
      screenshotAsset ? applyAssetToLayerFrame(deviceLayer, screenshotAsset, exportSize) : deviceLayer,
      {
        id: generateId("img"),
        type: "image" as const,
        visible: true,
        zIndex: 2,
        x: Math.round(-84 * scaleX),
        y: Math.round(196 * scaleY),
        width: Math.round(332 * scaleX),
        height: Math.round(332 * scaleY),
        assetRef: "",
        fit: "cover" as const,
        cornerRadius: Math.round(24 * Math.min(scaleX, scaleY)),
      },
      {
        id: generateId("text"),
        type: "text" as const,
        visible: true,
        zIndex: 3,
        x: Math.round(100 * scaleX),
        y: Math.round(2350 * scaleY),
        width: Math.round(1006 * scaleX),
        height: Math.round(120 * scaleY),
        content: `${projectName} - Feature ${slideNumber}`,
        fontFamily: "SF Pro Display",
        fontSize: Math.max(20, Math.round(48 * Math.min(scaleX, scaleY))),
        fontWeight: "600" as const,
        color: "#ffffff",
        align: "center" as const,
      },
    ] as Layer[],
  };
}

export function buildConfigForDevice(projectName: string, uploads: ScreenshotAsset[], deviceType: DeviceType): AiLayerTreeConfig {
  const exportSize = DEVICE_PRESETS[deviceType].exportSize;
  const slides = uploads.map((upload, index) => createSlideForDevice(projectName, index + 1, deviceType, upload));

  return {
    version: "1.0",
    exportedPngSize: exportSize,
    device: { frameRef: DEFAULT_DEVICE_FRAME_ASSET_ID },
    slides,
  };
}

export function sanitizeConfigAssetRefs(
  config: AiLayerTreeConfig,
  validAssetIds: Set<string>,
  options?: {
    removedAssetId?: string;
    removeOrphanSlides?: boolean;
  }
) {
  let changed = false;

  const sanitizedSlides = config.slides.flatMap((slide) => {
    const hadRemovedAsset = options?.removedAssetId
      ? slide.layers.some((layer) => "assetRef" in layer && layer.assetRef === options.removedAssetId)
      : false;

    const sanitizedLayers = slide.layers.map((layer) => {
      if (!("assetRef" in layer) || !layer.assetRef) {
        return layer;
      }

      if (validAssetIds.has(layer.assetRef)) {
        return layer;
      }

      changed = true;
      return {
        ...layer,
        assetRef: "",
      };
    });

    const hasRemainingAssetRef = sanitizedLayers.some((layer) => "assetRef" in layer && Boolean(layer.assetRef));
    if (
      options?.removeOrphanSlides &&
      hadRemovedAsset &&
      !hasRemainingAssetRef &&
      config.slides.length > 1
    ) {
      changed = true;
      return [];
    }

    const layersChanged = sanitizedLayers.some((layer, index) => layer !== slide.layers[index]);
    if (layersChanged) {
      return [{ ...slide, layers: sanitizedLayers }];
    }

    return [slide];
  });

  const nextSlides = sanitizedSlides.length > 0 ? sanitizedSlides : [config.slides[0]];
  if (nextSlides.length !== config.slides.length) {
    changed = true;
  }

  return {
    config: changed
      ? {
          ...config,
          slides: nextSlides,
        }
      : config,
    changed,
  };
}

export function scaleConfigToDevice(config: AiLayerTreeConfig, deviceType: DeviceType): AiLayerTreeConfig {
  const exportSize = DEVICE_PRESETS[deviceType].exportSize;
  const scaleX = exportSize.w / config.exportedPngSize.w;
  const scaleY = exportSize.h / config.exportedPngSize.h;

  return {
    ...config,
    exportedPngSize: exportSize,
    device: { frameRef: DEFAULT_DEVICE_FRAME_ASSET_ID },
    slides: config.slides.map((slide) => ({
      ...slide,
      layers: slide.layers.map((layer) => scaleLayer(layer, scaleX, scaleY, exportSize.w, exportSize.h)),
    })),
  };
}

export function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ios-kit";
}
