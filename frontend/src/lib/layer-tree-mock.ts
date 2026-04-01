// Mock 数据和配置

import { AiLayerTreeConfig, FrameConfig, StickerConfig } from "./layer-tree-types";

// Frame 资源配置（Mock）
export const FRAME_REGISTRY: Record<string, FrameConfig> = {
  "iphone-17-pro-silver": {
    id: "iphone-17-pro-silver",
    name: "iPhone 17 Pro Silver",
    pngUrl: "/asset/iPhone 17 Pro Silver.png",
    screenRect: { x: 14, y: 14, w: 412, h: 878 },
    deviceSize: { w: 440, h: 916 }
  }
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
    frameRef: "iphone-17-pro-silver"
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
          x: 397,
          y: 370,
          width: 412,
          height: 878,
          assetRef: "mock-upload-001",
          fit: "cover",
          cornerRadius: 47,
          showDeviceFrame: true,
          frameRef: "iphone-17-pro-silver"
        },
        {
          id: "text-1",
          type: "text",
          visible: true,
          zIndex: 2,
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
          x: 397,
          y: 370,
          width: 412,
          height: 878,
          assetRef: "mock-upload-002",
          fit: "cover",
          cornerRadius: 47,
          showDeviceFrame: true,
          frameRef: "iphone-17-pro-silver"
        },
        {
          id: "text-2",
          type: "text",
          visible: true,
          zIndex: 2,
          x: 100,
          y: 2350,
          width: 1006,
          height: 120,
          content: "即时通讯，畅聊无阻",
          fontFamily: "SF Pro Display",
          fontSize: 48,
          fontWeight: "600",
          color: "#ffffff",
          align: "center"
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
export function createDefaultLayer(type: LayerType, index: number): Layer {
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
