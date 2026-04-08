"use client";

import { useEffect, useState } from "react";
import { Group, Image as KonvaImage, Rect, Text } from "react-konva";
import { DEFAULT_DEVICE_FRAME_ASSET_ID, getDeviceFrameAsset } from "@/lib/device-frame-assets";
import type { Layer } from "@/lib/layer-tree-types";
import type { LayerAssetDebugInfo } from "@/lib/screenshot-editor";
import useImage from "use-image";

interface LayerRendererProps {
  assetSources: Record<string, string>;
  canvasSize: { w: number; h: number };
  debugMode?: boolean;
  layer: Layer;
  onAssetDebugChange?: (info: LayerAssetDebugInfo) => void;
  onPreviewFrameChange?: (
    layerId: string,
    frame: { x: number; y: number; width: number; height: number; rotation: number; opacity: number } | null
  ) => void;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layer: Layer) => void;
  selectedLayerId: string | null;
}

function traceRoundedRect(
  ctx: {
    beginPath: () => void;
    rect: (x: number, y: number, width: number, height: number) => void;
    moveTo: (x: number, y: number) => void;
    lineTo: (x: number, y: number) => void;
    quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => void;
    closePath: () => void;
  },
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  ctx.beginPath();
  if (safeRadius === 0) {
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    return;
  }

  ctx.moveTo(safeRadius, 0);
  ctx.lineTo(width - safeRadius, 0);
  ctx.quadraticCurveTo(width, 0, width, safeRadius);
  ctx.lineTo(width, height - safeRadius);
  ctx.quadraticCurveTo(width, height, width - safeRadius, height);
  ctx.lineTo(safeRadius, height);
  ctx.quadraticCurveTo(0, height, 0, height - safeRadius);
  ctx.lineTo(0, safeRadius);
  ctx.quadraticCurveTo(0, 0, safeRadius, 0);
  ctx.closePath();
}

function getImageDrawBox(
  fit: "cover" | "contain" | "fill",
  frameWidth: number,
  frameHeight: number,
  sourceWidth: number,
  sourceHeight: number
) {
  if (!sourceWidth || !sourceHeight || fit === "fill") {
    return { x: 0, y: 0, width: frameWidth, height: frameHeight };
  }

  const scale = fit === "contain"
    ? Math.min(frameWidth / sourceWidth, frameHeight / sourceHeight)
    : Math.max(frameWidth / sourceWidth, frameHeight / sourceHeight);

  return {
    x: (frameWidth - sourceWidth * scale) / 2,
    y: (frameHeight - sourceHeight * scale) / 2,
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
}

function getCrossOrigin(source?: string) {
  if (!source || source.startsWith("blob:") || source.startsWith("data:") || source.startsWith("/")) {
    return undefined;
  }

  if (/^https?:\/\//.test(source)) {
    return "anonymous";
  }

  return undefined;
}

function useLayerAssetDebug(
  layer: Extract<Layer, { assetRef?: string }>,
  source: string | undefined,
  imageStatus: string,
  image: HTMLImageElement | undefined,
  onAssetDebugChange?: (info: LayerAssetDebugInfo) => void
) {
  useEffect(() => {
    if (!layer.assetRef || !onAssetDebugChange) {
      return;
    }

    onAssetDebugChange({
      layerId: layer.id,
      layerType: layer.type,
      assetRef: layer.assetRef,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      zIndex: layer.zIndex,
      visible: layer.visible,
      previewUrl: source || "",
      sourceUrl: source || "",
      resolvedUrl: source,
      loadState:
        imageStatus === "loaded"
          ? "loaded"
          : imageStatus === "failed"
            ? "failed"
            : "pending",
      loadedWidth: image?.naturalWidth || image?.width,
      loadedHeight: image?.naturalHeight || image?.height,
      error: imageStatus === "failed" ? "use-image failed" : undefined,
    });
  }, [image, imageStatus, layer, onAssetDebugChange, source]);
}

function useNativeImage(source?: string) {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  const [status, setStatus] = useState<"pending" | "loaded" | "failed">(source ? "pending" : "failed");

  useEffect(() => {
    if (!source) {
      setImage(undefined);
      setStatus("failed");
      return;
    }

    let disposed = false;
    const nextImage = new window.Image();

    setStatus("pending");
    nextImage.onload = () => {
      if (disposed) {
        return;
      }
      setImage(nextImage);
      setStatus("loaded");
    };
    nextImage.onerror = () => {
      if (disposed) {
        return;
      }
      setImage(undefined);
      setStatus("failed");
    };
    nextImage.src = source;

    return () => {
      disposed = true;
    };
  }, [source]);

  return [image, status] as const;
}

function BackgroundLayerNode({
  assetSources,
  canvasSize,
  layer,
}: {
  assetSources: Record<string, string>;
  canvasSize: { w: number; h: number };
  layer: Extract<Layer, { type: "background" }>;
}) {
  const source = layer.assetRef ? assetSources[layer.assetRef] : undefined;
  const [image] = useImage(source || "", getCrossOrigin(source));

  if (layer.bgType === "solid") {
    return (
      <Rect
        id={layer.id}
        x={0}
        y={0}
        width={canvasSize.w}
        height={canvasSize.h}
        fill={layer.color}
        opacity={layer.opacity}
        rotation={layer.rotation}
        listening={false}
      />
    );
  }

  if (layer.bgType === "gradient" && layer.gradient) {
    const startColor = layer.gradient.stops[0]?.color || "#667eea";
    const endColor = layer.gradient.stops[1]?.color || "#764ba2";

    return (
      <Rect
        id={layer.id}
        x={0}
        y={0}
        width={canvasSize.w}
        height={canvasSize.h}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: canvasSize.w, y: canvasSize.h }}
        fillLinearGradientColorStops={[0, startColor, 1, endColor]}
        opacity={layer.opacity}
        rotation={layer.rotation}
        listening={false}
      />
    );
  }

  if (layer.bgType === "image" && image) {
    return (
      <KonvaImage
        id={layer.id}
        image={image}
        x={0}
        y={0}
        width={canvasSize.w}
        height={canvasSize.h}
        opacity={layer.opacity}
        rotation={layer.rotation}
        listening={false}
      />
    );
  }

  return null;
}

function ImageLayerNode({
  assetSources,
  debugMode,
  isSelected,
  layer,
  onAssetDebugChange,
  onPreviewFrameChange,
  onSelectLayer,
  onUpdateLayer,
}: {
  assetSources: Record<string, string>;
  debugMode: boolean;
  isSelected: boolean;
  layer: Extract<Layer, { type: "image" }>;
  onAssetDebugChange?: (info: LayerAssetDebugInfo) => void;
  onPreviewFrameChange?: (
    layerId: string,
    frame: { x: number; y: number; width: number; height: number; rotation: number; opacity: number } | null
  ) => void;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layer: Layer) => void;
}) {
  const source = layer.assetRef ? assetSources[layer.assetRef] : undefined;
  const [image, status] = useNativeImage(source);
  useLayerAssetDebug(layer, source, status, image || undefined, onAssetDebugChange);
  const cornerRadius = layer.cornerRadius || 0;

  return (
    <Group
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable
      onClick={() => onSelectLayer(layer.id)}
      onDragMove={(event) => {
        onPreviewFrameChange?.(layer.id, {
          x: event.target.x(),
          y: event.target.y(),
          width: layer.width,
          height: layer.height,
          rotation: event.target.rotation(),
          opacity: layer.opacity ?? 1,
        });
      }}
      onDragEnd={(event) => {
        onUpdateLayer({
          ...layer,
          x: event.target.x(),
          y: event.target.y(),
        });
        onPreviewFrameChange?.(layer.id, null);
      }}
    >
      <Rect
        width={layer.width}
        height={layer.height}
        fill="rgba(255,255,255,0.01)"
        cornerRadius={cornerRadius}
      />
      <Rect
        width={layer.width}
        height={layer.height}
        fill="none"
        stroke={isSelected ? "#eab308" : "#1a202c"}
        strokeWidth={isSelected ? 3 : 1}
        cornerRadius={cornerRadius}
      />
      {debugMode ? (
        <>
          <Rect
            width={layer.width}
            height={layer.height}
            fillEnabled={false}
            stroke="#ef4444"
            strokeWidth={4}
            dash={[12, 8]}
          />
          <Text
            x={8}
            y={8}
            text={`IMAGE ${Math.round(layer.width)}x${Math.round(layer.height)} ${status}`}
            fontSize={24}
            fontStyle="bold"
            fill="#ef4444"
          />
        </>
      ) : null}
    </Group>
  );
}

function DeviceLayerNode({
  assetSources,
  debugMode,
  isSelected,
  layer,
  onAssetDebugChange,
  onSelectLayer,
  onUpdateLayer,
}: {
  assetSources: Record<string, string>;
  debugMode: boolean;
  isSelected: boolean;
  layer: Extract<Layer, { type: "device" }>;
  onAssetDebugChange?: (info: LayerAssetDebugInfo) => void;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layer: Layer) => void;
}) {
  const source = layer.assetRef ? assetSources[layer.assetRef] : undefined;
  const [image, status] = useImage(source || "", getCrossOrigin(source));
  const frameAsset = getDeviceFrameAsset(layer.frameAssetId || DEFAULT_DEVICE_FRAME_ASSET_ID);
  const [frameImage] = useNativeImage(frameAsset?.assetUrl);
  useLayerAssetDebug(layer, source, status, image || undefined, onAssetDebugChange);

  const borderWidth = Math.max(2, layer.borderWidth || 10);
  const cornerRadius = layer.cornerRadius || 42;
  const screenshotOnlyInnerX = borderWidth;
  const screenshotOnlyInnerY = borderWidth;
  const screenshotOnlyInnerWidth = Math.max(10, layer.width - borderWidth * 2);
  const screenshotOnlyInnerHeight = Math.max(10, layer.height - borderWidth * 2);
  const screenshotOnlyInnerRadius = Math.max(0, cornerRadius - borderWidth);

  const frameScreenRect = frameAsset?.screenRect || { x: 0.03, y: 0.03, w: 0.94, h: 0.94 };
  const frameScreenX = layer.width * frameScreenRect.x;
  const frameScreenY = layer.height * frameScreenRect.y;
  const frameScreenWidth = layer.width * frameScreenRect.w;
  const frameScreenHeight = layer.height * frameScreenRect.h;
  const frameScreenRadius = Math.max(0, Math.min(frameScreenWidth, frameScreenHeight) * 0.08);
  const frameImageDrawBox = image
    ? getImageDrawBox(
        "contain",
        frameScreenWidth,
        frameScreenHeight,
        image.naturalWidth || image.width,
        image.naturalHeight || image.height
      )
    : null;

  return (
    <Group
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable
      onClick={() => onSelectLayer(layer.id)}
      onDragEnd={(event) => {
        onUpdateLayer({
          ...layer,
          x: event.target.x(),
          y: event.target.y(),
        });
      }}
    >
      {layer.renderMode === "frame-asset" ? (
        <>
          <Group
            x={frameScreenX}
            y={frameScreenY}
            clipFunc={(ctx) => {
              traceRoundedRect(ctx, frameScreenWidth, frameScreenHeight, frameScreenRadius);
            }}
          >
            <Rect
              width={frameScreenWidth}
              height={frameScreenHeight}
              fill="#ffffff"
              cornerRadius={frameScreenRadius}
            />
            {image && frameImageDrawBox ? (
              <KonvaImage
                image={image}
                x={frameImageDrawBox.x}
                y={frameImageDrawBox.y}
                width={frameImageDrawBox.width}
                height={frameImageDrawBox.height}
              />
            ) : null}
          </Group>
          {frameImage ? (
            <KonvaImage image={frameImage} x={0} y={0} width={layer.width} height={layer.height} listening={false} />
          ) : (
            <Rect width={layer.width} height={layer.height} fillEnabled={false} stroke={layer.borderColor} strokeWidth={4} cornerRadius={cornerRadius} />
          )}
          {isSelected ? (
            <Rect
              width={layer.width}
              height={layer.height}
              fillEnabled={false}
              stroke="#eab308"
              strokeWidth={3}
              cornerRadius={cornerRadius}
            />
          ) : null}
        </>
      ) : (
        <>
          <Rect
            width={layer.width}
            height={layer.height}
            fill={layer.borderColor}
            cornerRadius={cornerRadius}
          />
          <Group
            x={screenshotOnlyInnerX}
            y={screenshotOnlyInnerY}
            clipFunc={(ctx) => {
              traceRoundedRect(ctx, screenshotOnlyInnerWidth, screenshotOnlyInnerHeight, screenshotOnlyInnerRadius);
            }}
          >
            <Rect
              width={screenshotOnlyInnerWidth}
              height={screenshotOnlyInnerHeight}
              fill="#ffffff"
              cornerRadius={screenshotOnlyInnerRadius}
            />
            {image ? (
              <KonvaImage
                image={image}
                x={0}
                y={0}
                width={screenshotOnlyInnerWidth}
                height={screenshotOnlyInnerHeight}
              />
            ) : null}
          </Group>
          <Rect
            width={layer.width}
            height={layer.height}
            fillEnabled={false}
            stroke={isSelected ? "#eab308" : layer.borderColor}
            strokeWidth={isSelected ? 3 : 1}
            cornerRadius={cornerRadius}
          />
        </>
      )}
      {debugMode ? (
        <>
          <Rect
            width={layer.width}
            height={layer.height}
            fillEnabled={false}
            stroke="#10b981"
            strokeWidth={4}
            dash={[12, 8]}
          />
          <Text
            x={8}
            y={layer.height + 8}
            text={`DEVICE ${Math.round(layer.width)}x${Math.round(layer.height)} ${status}`}
            fontSize={24}
            fontStyle="bold"
            fill="#10b981"
          />
        </>
      ) : null}
    </Group>
  );
}

function StickerLayerNode({
  assetSources,
  layer,
  onSelectLayer,
  onUpdateLayer,
}: {
  assetSources: Record<string, string>;
  layer: Extract<Layer, { type: "sticker" }>;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layer: Layer) => void;
}) {
  const source = layer.assetRef ? assetSources[layer.assetRef] : undefined;
  const [image] = useImage(source || "", getCrossOrigin(source));

  if (!image) {
    return null;
  }

  return (
    <KonvaImage
      id={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable
      onClick={() => onSelectLayer(layer.id)}
      onDragEnd={(event) => {
        onUpdateLayer({
          ...layer,
          x: event.target.x(),
          y: event.target.y(),
        });
      }}
    />
  );
}

export default function LayerRenderer({
  assetSources,
  canvasSize,
  debugMode = false,
  layer,
  onAssetDebugChange,
  onPreviewFrameChange,
  onSelectLayer,
  onUpdateLayer,
  selectedLayerId,
}: LayerRendererProps) {
  const isSelected = selectedLayerId === layer.id;

  if (!layer.visible) {
    return null;
  }

  if (layer.type === "background") {
    return (
      <BackgroundLayerNode
        assetSources={assetSources}
        canvasSize={canvasSize}
        layer={layer}
      />
    );
  }

  if (layer.type === "image") {
    return (
      <ImageLayerNode
        assetSources={assetSources}
        debugMode={debugMode}
        isSelected={isSelected}
        layer={layer}
        onAssetDebugChange={onAssetDebugChange}
        onPreviewFrameChange={onPreviewFrameChange}
        onSelectLayer={onSelectLayer}
        onUpdateLayer={onUpdateLayer}
      />
    );
  }

  if (layer.type === "device") {
    return (
      <DeviceLayerNode
        assetSources={assetSources}
        debugMode={debugMode}
        isSelected={isSelected}
        layer={layer}
        onAssetDebugChange={onAssetDebugChange}
        onSelectLayer={onSelectLayer}
        onUpdateLayer={onUpdateLayer}
      />
    );
  }

  if (layer.type === "text") {
    return (
      <Text
        id={layer.id}
        x={layer.x}
        y={layer.y}
        text={layer.content}
        fontSize={layer.fontSize}
        fill={layer.color}
        align={layer.align}
        width={layer.width}
        height={layer.height}
        fontFamily={layer.fontFamily}
        fontStyle={
          layer.fontWeight === "bold" || layer.fontWeight === "700"
            ? "bold"
            : layer.fontWeight === "600"
              ? "600"
              : "normal"
        }
        opacity={layer.opacity}
        rotation={layer.rotation}
        draggable
        onClick={() => onSelectLayer(layer.id)}
        onDragEnd={(event) => {
          onUpdateLayer({
            ...layer,
            x: event.target.x(),
            y: event.target.y(),
          });
        }}
      />
    );
  }

  if (layer.type === "sticker") {
    return (
      <StickerLayerNode
        assetSources={assetSources}
        layer={layer}
        onSelectLayer={onSelectLayer}
        onUpdateLayer={onUpdateLayer}
      />
    );
  }

  return null;
}
