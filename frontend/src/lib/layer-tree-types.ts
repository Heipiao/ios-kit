// AiLayerTreeConfig 类型定义

export type LayerType = "background" | "device" | "image" | "text" | "sticker";

export interface BaseLayer {
  id: string;
  type: LayerType;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex: number;
}

export interface BackgroundLayer extends BaseLayer {
  type: "background";
  bgType: "solid" | "gradient" | "image";
  color?: string;
  gradient?: {
    type: "linear" | "radial";
    stops: { offset: number; color: string; }[];
    angle?: number;
  };
  assetRef?: string;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  assetRef: string;
  fit: "cover" | "contain" | "fill";
  cornerRadius?: number;
  showDeviceFrame?: boolean;
  frameRef?: string;
  imageTransform?: {
    scale: number;
    translateX?: number;
    translateY?: number;
  };
}

export type DeviceRenderMode = "screenshot-only" | "frame-asset";

export interface DeviceLayer extends BaseLayer {
  type: "device";
  assetRef?: string;
  renderMode: DeviceRenderMode;
  frameAssetId?: string;
  borderColor: string;
  cornerRadius?: number;
  borderWidth?: number;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "600" | "700";
  color: string;
  align: "left" | "center" | "right";
  lineHeight?: number;
  maxLines?: number;
  textShadow?: {
    blur: number;
    color: string;
    offsetX: number;
    offsetY: number;
  };
}

export interface StickerLayer extends BaseLayer {
  type: "sticker";
  stickerId: string;
  assetRef?: string;
}

export type Layer = BackgroundLayer | DeviceLayer | ImageLayer | TextLayer | StickerLayer;

export interface SlideConfig {
  slideId: string;
  name?: string;
  layers: Layer[];
}

export interface AiLayerTreeConfig {
  version: "1.0";
  exportedPngSize: { w: number; h: number };
  device?: {
    frameRef?: string;
  };
  slides: SlideConfig[];
}

export interface DeviceFrameAssetConfig {
  id: string;
  modelId: string;
  modelName: string;
  colorId: string;
  colorName: string;
  name: string;
  assetUrl: string;
  kind: "png";
  screenRect: { x: number; y: number; w: number; h: number };
  outerSize: { w: number; h: number };
}

// 贴纸配置
export interface StickerConfig {
  id: string;
  name: string;
  pngUrl: string;
}
