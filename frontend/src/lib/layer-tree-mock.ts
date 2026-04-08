// Mock 数据和配置

import { DEFAULT_DEVICE_FRAME_ASSET_ID, getDeviceFrameAsset } from "./device-frame-assets";
import { AiLayerTreeConfig, DeviceFrameAssetConfig, StickerConfig, Layer } from "./layer-tree-types";

// Frame 资源配置（Mock）
export const FRAME_REGISTRY: Record<string, DeviceFrameAssetConfig> = {
  [DEFAULT_DEVICE_FRAME_ASSET_ID]: getDeviceFrameAsset(DEFAULT_DEVICE_FRAME_ASSET_ID)!,
};

// 贴纸配置（Mock）
export const STICKER_REGISTRY: Record<string, StickerConfig> = {
  "5g-badge": {
    id: "5g-badge",
    name: "5G 角标",
    pngUrl: "/asset/stickers/5g-badge.png"
  },
  "ai-chip": {
    id: "ai-chip",
    name: "AI 芯片",
    pngUrl: "/asset/stickers/ai-chip.png"
  }
};

// 字体选项
export const FONT_OPTIONS = [
  "SF Pro Display",
  "SF Pro Text",
  "Helvetica Neue",
  "Arial",
  "Georgia"
];

// Mock LayerTree 配置
export const MOCK_LAYER_TREE_CONFIG: AiLayerTreeConfig = {
  version: "1.0",
  exportedPngSize: { w: 1206, h: 2622 },
  device: {
    frameRef: DEFAULT_DEVICE_FRAME_ASSET_ID
  },
  slides: [
    {
      slideId: "slide-1",
      name: "首页",
      layers: [
        {
          id: "bg-1",
          type: "background",
          visible: true,
          zIndex: 0,
          x: 0,
          y: 0,
          width: 1206,
          height: 2622,
          bgType: "gradient",
          gradient: {
            type: "linear",
            stops: [
              { offset: 0, color: "#667eea" },
              { offset: 1, color: "#764ba2" }
            ],
            angle: 135
          }
        },
        {
          id: "img-1",
          type: "image",
          visible: true,
          zIndex: 1,
          x: -84,
          y: 196,
          width: 332,
          height: 332,
          assetRef: "",
          fit: "cover",
          cornerRadius: 24
        },
        {
          id: "device-1",
          type: "device",
          visible: true,
          zIndex: 2,
          x: 382,
          y: 355,
          width: 442,
          height: 908,
          renderMode: "frame-asset",
          frameAssetId: DEFAULT_DEVICE_FRAME_ASSET_ID,
          assetRef: "mock-upload-001",
          borderColor: "#111111",
          cornerRadius: 60,
          borderWidth: 12
        },
        {
          id: "text-1",
          type: "text",
          visible: true,
          zIndex: 3,
          x: 100,
          y: 2350,
          width: 1006,
          height: 120,
          content: "智能助手，随时陪伴",
          fontFamily: "SF Pro Display",
          fontSize: 48,
          fontWeight: "600",
          color: "#ffffff",
          align: "center",
          textShadow: {
            blur: 20,
            color: "rgba(0,0,0,0.5)",
            offsetX: 0,
            offsetY: 4
          }
        }
      ]
    },
    {
      slideId: "slide-2",
      name: "聊天界面",
      layers: [
        {
          id: "bg-2",
          type: "background",
          visible: true,
          zIndex: 0,
          x: 0,
          y: 0,
          width: 1206,
          height: 2622,
          bgType: "gradient",
          gradient: {
            type: "linear",
            stops: [
              { offset: 0, color: "#4facfe" },
              { offset: 1, color: "#00f2fe" }
            ],
            angle: 135
          }
        },
        {
          id: "img-2",
          type: "image",
          visible: true,
          zIndex: 1,
          x: 980,
          y: 148,
          width: 300,
          height: 300,
          assetRef: "",
          fit: "cover",
          cornerRadius: 24
        },
        {
          id: "device-2",
          type: "device",
          visible: true,
          zIndex: 2,
          x: 306,
          y: 402,
          width: 442,
          height: 908,
          renderMode: "frame-asset",
          frameAssetId: DEFAULT_DEVICE_FRAME_ASSET_ID,
          assetRef: "mock-upload-002",
          borderColor: "#8f96ff",
          cornerRadius: 60,
          borderWidth: 12
        },
        {
          id: "text-2",
          type: "text",
          visible: true,
          zIndex: 3,
          x: 100,
          y: 2330,
          width: 860,
          height: 120,
          content: "即时通讯，畅聊无阻",
          fontFamily: "SF Pro Display",
          fontSize: 48,
          fontWeight: "600",
          color: "#ffffff",
          align: "left"
        }
      ]
    }
  ]
};

// 辅助函数：生成唯一 ID
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 辅助函数：创建默认图层
export function createDefaultLayer(type: Layer["type"], index: number): Layer {
  const baseLayer = {
    id: generateId(type),
    visible: true,
    x: 100,
    y: 100,
    width: 400,
    height: 200,
    rotation: 0,
    opacity: 1,
    zIndex: index
  };

  switch (type) {
    case "background":
      return {
        ...baseLayer,
        type: "background",
        bgType: "solid",
        color: "#667eea",
        x: 0,
        y: 0,
        width: 1206,
        height: 2622,
        zIndex: 0
      };
    case "image":
      return {
        ...baseLayer,
        type: "image",
        assetRef: "",
        fit: "cover",
        cornerRadius: 0
      };
    case "device":
      return {
        ...baseLayer,
        type: "device",
        width: 442,
        height: 908,
        assetRef: "",
        renderMode: "frame-asset",
        frameAssetId: DEFAULT_DEVICE_FRAME_ASSET_ID,
        borderColor: "#111111",
        cornerRadius: 60,
        borderWidth: 12
      };
    case "text":
      return {
        ...baseLayer,
        type: "text",
        content: "新文本",
        fontFamily: "SF Pro Display",
        fontSize: 32,
        fontWeight: "normal",
        color: "#000000",
        align: "left"
      };
    case "sticker":
      return {
        ...baseLayer,
        type: "sticker",
        stickerId: "5g-badge"
      };
  }
}
