"use client";

import type { DeviceFrameAssetConfig } from "./layer-tree-types";

type RawPresetGroup = {
  modelId: string;
  modelName: string;
  outerSize: { w: number; h: number };
  screenSize: { w: number; h: number };
  variants: Array<{
    colorId: string;
    colorName: string;
    assetPath: string;
  }>;
};

function buildVendorAssetUrl(relativePath: string) {
  return `/api/device-frames/${relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

const IOS_BEZEL_PRESET_GROUPS: RawPresetGroup[] = [
  {
    modelId: "iphone-13-mini",
    modelName: "iPhone 13 mini",
    outerSize: { w: 1280, h: 2540 },
    screenSize: { w: 1080, h: 2340 },
    variants: [
      { colorId: "black", colorName: "Black", assetPath: "/vendor/mockup-device-frames/Exports/iOS/13 mini/13 mini - Black.png" },
      { colorId: "blue", colorName: "Blue", assetPath: "/vendor/mockup-device-frames/Exports/iOS/13 mini/13 mini - Blue.png" },
      { colorId: "pink", colorName: "Pink", assetPath: "/vendor/mockup-device-frames/Exports/iOS/13 mini/13 mini - Pink.png" },
      { colorId: "product-red", colorName: "Product (RED)", assetPath: "/vendor/mockup-device-frames/Exports/iOS/13 mini/13 mini - Product (RED).png" },
      { colorId: "starlight", colorName: "Starlight", assetPath: "/vendor/mockup-device-frames/Exports/iOS/13 mini/13 mini - Starlight.png" },
    ],
  },
  {
    modelId: "iphone-14-pro-max",
    modelName: "iPhone 14 Pro Max",
    outerSize: { w: 1490, h: 2996 },
    screenSize: { w: 1290, h: 2796 },
    variants: [
      { colorId: "deep-purple", colorName: "Deep Purple", assetPath: "/vendor/mockup-device-frames/Exports/iOS/14 Pro Max/14 Pro Max - Deep Purple.png" },
      { colorId: "gold", colorName: "Gold", assetPath: "/vendor/mockup-device-frames/Exports/iOS/14 Pro Max/14 Pro Max - Gold.png" },
      { colorId: "silver", colorName: "Silver", assetPath: "/vendor/mockup-device-frames/Exports/iOS/14 Pro Max/14 Pro Max - Silver.png" },
      { colorId: "space-black", colorName: "Space Black", assetPath: "/vendor/mockup-device-frames/Exports/iOS/14 Pro Max/14 Pro Max - Space Black.png" },
    ],
  },
  {
    modelId: "iphone-15-pro-max",
    modelName: "iPhone 15 Pro Max",
    outerSize: { w: 1490, h: 2996 },
    screenSize: { w: 1290, h: 2796 },
    variants: [
      { colorId: "black-titanium", colorName: "Black Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/15 Pro Max/15 Pro Max - Black Titanium.png" },
      { colorId: "blue-titanium", colorName: "Blue Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/15 Pro Max/15 Pro Max - Blue Titanium.png" },
      { colorId: "natural-titanium", colorName: "Natural Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/15 Pro Max/15 Pro Max - Natural Titanium.png" },
      { colorId: "white-titanium", colorName: "White Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/15 Pro Max/15 Pro Max - White Titanium.png" },
    ],
  },
  {
    modelId: "iphone-16",
    modelName: "iPhone 16",
    outerSize: { w: 1379, h: 2756 },
    screenSize: { w: 1179, h: 2556 },
    variants: [
      { colorId: "black", colorName: "Black", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16/16 - Black.png" },
      { colorId: "pink", colorName: "Pink", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16/16 - Pink.png" },
      { colorId: "teal", colorName: "Teal", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16/16 - Teal.png" },
      { colorId: "ultramarine", colorName: "Ultramarine", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16/16 - Ultramarine.png" },
      { colorId: "white", colorName: "White", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16/16 - White.png" },
    ],
  },
  {
    modelId: "iphone-16-plus",
    modelName: "iPhone 16 Plus",
    outerSize: { w: 1490, h: 2996 },
    screenSize: { w: 1290, h: 2796 },
    variants: [
      { colorId: "black", colorName: "Black", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Plus/16 Plus - Black.png" },
      { colorId: "pink", colorName: "Pink", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Plus/16 Plus - Pink.png" },
      { colorId: "teal", colorName: "Teal", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Plus/16 Plus - Teal.png" },
      { colorId: "ultramarine", colorName: "Ultramarine", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Plus/16 Plus - Ultramarine.png" },
      { colorId: "white", colorName: "White", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Plus/16 Plus - White.png" },
    ],
  },
  {
    modelId: "iphone-16-pro",
    modelName: "iPhone 16 Pro",
    outerSize: { w: 1406, h: 2822 },
    screenSize: { w: 1206, h: 2622 },
    variants: [
      { colorId: "black-titanium", colorName: "Black Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Pro/16 Pro - Black Titanium.png" },
      { colorId: "desert-titanium", colorName: "Desert Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Pro/16 Pro - Desert Titanium.png" },
      { colorId: "natural-titanium", colorName: "Natural Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Pro/16 Pro - Natural Titanium.png" },
      { colorId: "white-titanium", colorName: "White Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Pro/16 Pro - White Titanium.png" },
    ],
  },
  {
    modelId: "iphone-16-pro-max",
    modelName: "iPhone 16 Pro Max",
    outerSize: { w: 1520, h: 3068 },
    screenSize: { w: 1320, h: 2868 },
    variants: [
      { colorId: "black-titanium", colorName: "Black Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Pro Max/16 Pro Max - Black Titanium.png" },
      { colorId: "desert-titanium", colorName: "Desert Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Pro Max/16 Pro Max - Desert Titanium.png" },
      { colorId: "natural-titanium", colorName: "Natural Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Pro Max/16 Pro Max - Natural Titanium.png" },
      { colorId: "white-titanium", colorName: "White Titanium", assetPath: "/vendor/mockup-device-frames/Exports/iOS/16 Pro Max/16 Pro Max - White Titanium.png" },
    ],
  },
  {
    modelId: "iphone-17-pro",
    modelName: "iPhone 17 Pro",
    outerSize: { w: 1406, h: 2822 },
    screenSize: { w: 1206, h: 2622 },
    variants: [
      { colorId: "cosmic-orange", colorName: "Cosmic Orange", assetPath: "/vendor/mockup-device-frames/Exports/iOS/17 Pro/17 Pro - Cosmic Orange.png" },
      { colorId: "deep-blue", colorName: "Deep Blue", assetPath: "/vendor/mockup-device-frames/Exports/iOS/17 Pro/17 Pro - Deep Blue.png" },
      { colorId: "silver", colorName: "Silver", assetPath: "/vendor/mockup-device-frames/Exports/iOS/17 Pro/17 Pro - Silver.png" },
    ],
  },
  {
    modelId: "iphone-17-pro-max",
    modelName: "iPhone 17 Pro Max",
    outerSize: { w: 1520, h: 3068 },
    screenSize: { w: 1320, h: 2868 },
    variants: [
      { colorId: "cosmic-orange", colorName: "Cosmic Orange", assetPath: "/vendor/mockup-device-frames/Exports/iOS/17 Pro Max/17 Pro Max - Cosmic Orange.png" },
      { colorId: "deep-blue", colorName: "Deep Blue", assetPath: "/vendor/mockup-device-frames/Exports/iOS/17 Pro Max/17 Pro Max - Deep Blue.png" },
      { colorId: "silver", colorName: "Silver", assetPath: "/vendor/mockup-device-frames/Exports/iOS/17 Pro Max/17 Pro Max - Silver.png" },
    ],
  },
  {
    modelId: "iphone-air",
    modelName: "iPhone Air",
    outerSize: { w: 1490, h: 2996 },
    screenSize: { w: 1290, h: 2796 },
    variants: [
      { colorId: "cloud-white", colorName: "Cloud White", assetPath: "/vendor/mockup-device-frames/Exports/iOS/Air/Air - Cloud White.png" },
      { colorId: "light-gold", colorName: "Light Gold", assetPath: "/vendor/mockup-device-frames/Exports/iOS/Air/Air - Light Gold.png" },
      { colorId: "sky-blue", colorName: "Sky Blue", assetPath: "/vendor/mockup-device-frames/Exports/iOS/Air/Air - Sky Blue.png" },
      { colorId: "space-black", colorName: "Space Black", assetPath: "/vendor/mockup-device-frames/Exports/iOS/Air/Air - Space Black.png" },
    ],
  },
];

function toNormalizedScreenRect(
  outerSize: { w: number; h: number },
  screenSize: { w: number; h: number }
) {
  const marginX = (outerSize.w - screenSize.w) / 2;
  const marginY = (outerSize.h - screenSize.h) / 2;
  return {
    x: marginX / outerSize.w,
    y: marginY / outerSize.h,
    w: screenSize.w / outerSize.w,
    h: screenSize.h / outerSize.h,
  };
}

export const DEFAULT_DEVICE_FRAME_ASSET_ID = "iphone-17-pro-silver";

const frameAssets = IOS_BEZEL_PRESET_GROUPS.flatMap((group) => {
  const screenRect = toNormalizedScreenRect(group.outerSize, group.screenSize);

  return group.variants.map((variant) => {
    const id = `${group.modelId}-${variant.colorId}`;
    return [
      id,
      {
        id,
        modelId: group.modelId,
        modelName: group.modelName,
        colorId: variant.colorId,
        colorName: variant.colorName,
        name: `${group.modelName} - ${variant.colorName}`,
        assetUrl: buildVendorAssetUrl(variant.assetPath.replace("/vendor/mockup-device-frames/Exports/iOS/", "")),
        kind: "png" as const,
        screenRect,
        outerSize: group.outerSize,
      } satisfies DeviceFrameAssetConfig,
    ] as const;
  });
});

export const DEVICE_FRAME_ASSETS: Record<string, DeviceFrameAssetConfig> = Object.fromEntries(frameAssets);

export const DEVICE_FRAME_MODEL_OPTIONS = IOS_BEZEL_PRESET_GROUPS.map((group) => ({
  id: group.modelId,
  name: group.modelName,
}));

export function getDeviceFrameAsset(frameAssetId?: string | null) {
  if (!frameAssetId) {
    return undefined;
  }

  return DEVICE_FRAME_ASSETS[frameAssetId];
}

export function getDeviceFrameColorOptions(modelId: string) {
  return Object.values(DEVICE_FRAME_ASSETS)
    .filter((asset) => asset.modelId === modelId)
    .map((asset) => ({
      id: asset.colorId,
      name: asset.colorName,
      frameAssetId: asset.id,
    }));
}

export function findDeviceFrameAssetId(modelId: string, colorId: string) {
  return Object.values(DEVICE_FRAME_ASSETS).find((asset) => {
    return asset.modelId === modelId && asset.colorId === colorId;
  })?.id;
}
