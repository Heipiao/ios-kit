// AiLayerTreeConfig 类型定义

export type LayerType = "background" | "image" | "text" | "sticker";

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

export type Layer = BackgroundLayer | ImageLayer | TextLayer | StickerLayer;

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

// Frame 资源配置
export interface FrameConfig {
  id: string;
  name: string;
  pngUrl: string;
  screenRect: { x: number; y: number; w: number; h: number };
  deviceSize: { w: number; h: number };
}

// 贴纸配置
export interface StickerConfig {
  id: string;
  name: string;
  pngUrl: string;
}
