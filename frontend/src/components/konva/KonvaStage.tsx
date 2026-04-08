"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer as KonvaLayer, Stage, Transformer } from "react-konva";
import { getAssetContentUrl } from "@/lib/api-projects";
import { DEFAULT_DEVICE_FRAME_ASSET_ID, getDeviceFrameAsset } from "@/lib/device-frame-assets";
import type { AiLayerTreeConfig, Layer } from "@/lib/layer-tree-types";
import type { LayerAssetDebugInfo, ScreenshotAsset } from "@/lib/screenshot-editor";
import LayerRenderer from "./LayerRenderer";

type OverlayFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
};

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
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

function buildCanvasFont(layer: Extract<Layer, { type: "text" }>) {
  const weight =
    layer.fontWeight === "bold" || layer.fontWeight === "700"
      ? "700"
      : layer.fontWeight === "600"
        ? "600"
        : "400";
  return `${weight} ${layer.fontSize}px ${layer.fontFamily}`;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    let currentLine = "";
    for (const char of rawLine) {
      const nextLine = currentLine + char;
      if (currentLine && ctx.measureText(nextLine).width > maxWidth) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = nextLine;
      }
    }
    lines.push(currentLine || rawLine);
  }
  return lines;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

async function exportSlideToDataUrl(
  config: AiLayerTreeConfig,
  slide: AiLayerTreeConfig["slides"][number],
  assetSourceLookup: Record<string, string>
) {
  const canvas = document.createElement("canvas");
  canvas.width = config.exportedPngSize.w;
  canvas.height = config.exportedPngSize.h;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create export canvas");
  }

  const imageCache = new Map<string, Promise<HTMLImageElement>>();
  const getImage = (assetRef?: string) => {
    if (!assetRef) {
      return Promise.resolve(null);
    }
    const source = assetSourceLookup[assetRef];
    if (!source) {
      return Promise.resolve(null);
    }
    const cached = imageCache.get(source);
    if (cached) {
      return cached.then((image) => image);
    }
    const next = loadImage(source);
    imageCache.set(source, next);
    return next;
  };

  const sortedLayers = [...slide.layers].sort((left, right) => left.zIndex - right.zIndex);

  for (const layer of sortedLayers) {
    if (!layer.visible) {
      continue;
    }

    context.save();
    context.globalAlpha = layer.opacity ?? 1;

    if (layer.type === "background") {
      if (layer.bgType === "solid") {
        context.fillStyle = layer.color || "#ffffff";
        context.fillRect(0, 0, config.exportedPngSize.w, config.exportedPngSize.h);
      } else if (layer.bgType === "gradient") {
        const gradient = context.createLinearGradient(0, 0, config.exportedPngSize.w, config.exportedPngSize.h);
        for (const stop of layer.gradient?.stops || []) {
          gradient.addColorStop(stop.offset, stop.color);
        }
        context.fillStyle = gradient;
        context.fillRect(0, 0, config.exportedPngSize.w, config.exportedPngSize.h);
      } else if (layer.bgType === "image" && layer.assetRef) {
        const image = await getImage(layer.assetRef);
        if (image) {
          context.drawImage(image, 0, 0, config.exportedPngSize.w, config.exportedPngSize.h);
        }
      }
      context.restore();
      continue;
    }

    if (layer.type === "image") {
      context.translate(layer.x, layer.y);
      context.rotate(((layer.rotation || 0) * Math.PI) / 180);
      traceRoundedRect(context, layer.width, layer.height, layer.cornerRadius || 0);
      context.clip();
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, layer.width, layer.height);
      const image = await getImage(layer.assetRef);
      if (image) {
        const drawBox = getImageDrawBox(
          layer.fit,
          layer.width,
          layer.height,
          image.naturalWidth || image.width,
          image.naturalHeight || image.height
        );
        context.drawImage(image, drawBox.x, drawBox.y, drawBox.width, drawBox.height);
      }
      context.restore();
      continue;
    }

    if (layer.type === "device") {
      context.translate(layer.x, layer.y);
      context.rotate(((layer.rotation || 0) * Math.PI) / 180);

      const image = await getImage(layer.assetRef);
      if (layer.renderMode === "frame-asset") {
        const frameAsset = getDeviceFrameAsset(layer.frameAssetId || DEFAULT_DEVICE_FRAME_ASSET_ID);
        const screenRect = frameAsset?.screenRect || { x: 0.03, y: 0.03, w: 0.94, h: 0.94 };
        const screenX = layer.width * screenRect.x;
        const screenY = layer.height * screenRect.y;
        const screenWidth = layer.width * screenRect.w;
        const screenHeight = layer.height * screenRect.h;
        const screenRadius = Math.max(0, Math.min(screenWidth, screenHeight) * 0.08);

        context.save();
        context.translate(screenX, screenY);
        traceRoundedRect(context, screenWidth, screenHeight, screenRadius);
        context.clip();
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, screenWidth, screenHeight);
        if (image) {
          const drawBox = getImageDrawBox(
            "contain",
            screenWidth,
            screenHeight,
            image.naturalWidth || image.width,
            image.naturalHeight || image.height
          );
          context.drawImage(image, drawBox.x, drawBox.y, drawBox.width, drawBox.height);
        }
        context.restore();

        if (frameAsset) {
          const frameImage = await loadImage(frameAsset.assetUrl);
          context.drawImage(frameImage, 0, 0, layer.width, layer.height);
        } else {
          context.lineWidth = 4;
          context.strokeStyle = layer.borderColor;
          traceRoundedRect(context, layer.width, layer.height, layer.cornerRadius || 42);
          context.stroke();
        }
      } else {
        const borderWidth = Math.max(2, layer.borderWidth || 10);
        const cornerRadius = layer.cornerRadius || 42;
        const screenX = borderWidth;
        const screenY = borderWidth;
        const screenWidth = Math.max(10, layer.width - borderWidth * 2);
        const screenHeight = Math.max(10, layer.height - borderWidth * 2);
        const screenRadius = Math.max(0, cornerRadius - borderWidth);

        context.fillStyle = layer.borderColor;
        traceRoundedRect(context, layer.width, layer.height, cornerRadius);
        context.fill();

        context.save();
        context.translate(screenX, screenY);
        traceRoundedRect(context, screenWidth, screenHeight, screenRadius);
        context.clip();
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, screenWidth, screenHeight);
        if (image) {
          const drawBox = getImageDrawBox(
            "contain",
            screenWidth,
            screenHeight,
            image.naturalWidth || image.width,
            image.naturalHeight || image.height
          );
          context.drawImage(image, drawBox.x, drawBox.y, drawBox.width, drawBox.height);
        }
        context.restore();
      }
      context.restore();
      continue;
    }

    if (layer.type === "text") {
      context.translate(layer.x, layer.y);
      context.rotate(((layer.rotation || 0) * Math.PI) / 180);
      context.font = buildCanvasFont(layer);
      context.fillStyle = layer.color;
      context.textBaseline = "top";
      context.textAlign = layer.align;
      if (layer.textShadow) {
        context.shadowBlur = layer.textShadow.blur;
        context.shadowColor = layer.textShadow.color;
        context.shadowOffsetX = layer.textShadow.offsetX;
        context.shadowOffsetY = layer.textShadow.offsetY;
      }
      const lines = wrapCanvasText(context, layer.content, layer.width);
      const lineHeight = (layer.lineHeight || 1.2) * layer.fontSize;
      const startX = layer.align === "center" ? layer.width / 2 : layer.align === "right" ? layer.width : 0;
      lines.slice(0, layer.maxLines || lines.length).forEach((line, index) => {
        context.fillText(line, startX, index * lineHeight, layer.width);
      });
      context.restore();
      continue;
    }

    if (layer.type === "sticker" && layer.assetRef) {
      context.translate(layer.x, layer.y);
      context.rotate(((layer.rotation || 0) * Math.PI) / 180);
      const image = await getImage(layer.assetRef);
      if (image) {
        context.drawImage(image, 0, 0, layer.width, layer.height);
      }
      context.restore();
      continue;
    }

    context.restore();
  }

  return canvas.toDataURL("image/png", 1);
}

interface KonvaStageProps {
  config: AiLayerTreeConfig;
  debugMode?: boolean;
  exportRequest: number;
  onExportReady: (dataUrl: string) => void;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayer: (layer: Layer) => void;
  onDebugAssetsChange?: (assets: LayerAssetDebugInfo[]) => void;
  selectedLayerId: string | null;
  slideIndex: number;
  uploads: ScreenshotAsset[];
}

export default function KonvaStage({
  config,
  debugMode = false,
  exportRequest,
  onExportReady,
  onSelectLayer,
  onUpdateLayer,
  onDebugAssetsChange,
  selectedLayerId,
  slideIndex,
  uploads,
}: KonvaStageProps) {
  const canvasRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const handledExportRequestRef = useRef(0);
  const [isClient, setIsClient] = useState(false);
  const [assetDebugMap, setAssetDebugMap] = useState<Record<string, LayerAssetDebugInfo>>({});
  const [overlayFrames, setOverlayFrames] = useState<Record<string, OverlayFrame>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setOverlayFrames({});
  }, [slideIndex]);

  const slide = config.slides[slideIndex];

  const imageSources = useMemo(() => {
    if (!slide) {
      return [];
    }

    const assetIds = new Set<string>();
    for (const layer of slide.layers) {
      if ("assetRef" in layer && layer.assetRef) {
        assetIds.add(layer.assetRef);
      }
    }

    const uploadLookup = Object.fromEntries(uploads.map((upload) => [upload.id, upload]));

    return Array.from(assetIds).map((assetId) => {
      const existing = uploadLookup[assetId];
      if (existing) {
        return existing;
      }

      const sourceUrl = getAssetContentUrl(assetId);
      return {
        id: assetId,
        name: assetId,
        previewUrl: sourceUrl,
        sourceUrl,
        width: 0,
        height: 0,
      } satisfies ScreenshotAsset;
    });
  }, [slide, uploads]);

  const assetSourceLookup = useMemo(() => {
    return Object.fromEntries(
      imageSources.map((source) => [source.id, source.sourceUrl || source.previewUrl])
    );
  }, [imageSources]);

  const assetLayers = useMemo(() => {
    if (!slide) {
      return [];
    }

    return slide.layers.filter((layer): layer is Extract<Layer, { assetRef?: string }> => {
      return "assetRef" in layer && Boolean(layer.assetRef);
    });
  }, [slide]);

  useEffect(() => {
    const nextDebugMap = Object.fromEntries(
      assetLayers.map((layer) => {
        const source = imageSources.find((upload) => upload.id === layer.assetRef);
        return [layer.id, {
          layerId: layer.id,
          layerType: layer.type,
          assetRef: layer.assetRef!,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          zIndex: layer.zIndex,
          visible: layer.visible,
          previewUrl: source?.previewUrl || "",
          sourceUrl: source?.sourceUrl || "",
          resolvedUrl: assetSourceLookup[layer.assetRef!] || "",
          loadState: "pending" as const,
        }];
      })
    );

    setAssetDebugMap(nextDebugMap);
  }, [assetLayers, assetSourceLookup, imageSources]);

  useEffect(() => {
    const diagnostics = Object.values(assetDebugMap).sort((left, right) => left.zIndex - right.zIndex);
    onDebugAssetsChange?.(diagnostics);
    if (debugMode && process.env.NODE_ENV !== "production") {
      console.debug("[screenshots] asset diagnostics", diagnostics);
    }
  }, [assetDebugMap, debugMode, onDebugAssetsChange]);

  const handleAssetDebugChange = useCallback((info: LayerAssetDebugInfo) => {
    setAssetDebugMap((current) => {
      const previous = current[info.layerId];
      if (previous && JSON.stringify(previous) === JSON.stringify(info)) {
        return current;
      }

      return {
        ...current,
        [info.layerId]: info,
      };
    });
  }, []);

  const handleOverlayFrameChange = useCallback((layerId: string, frame: OverlayFrame | null) => {
    setOverlayFrames((current) => {
      if (!frame) {
        if (!(layerId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[layerId];
        return next;
      }
      return {
        ...current,
        [layerId]: frame,
      };
    });
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !transformerRef.current || !canvasRef.current) {
      return;
    }

    const stage = canvasRef.current.getStage();
    if (!stage) {
      return;
    }

    const selectedNode = stage.findOne(`#${selectedLayerId}`);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
      return;
    }

    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [config, isClient, selectedLayerId]);

  useEffect(() => {
    if (exportRequest <= 0 || exportRequest === handledExportRequestRef.current || !canvasRef.current) {
      return;
    }

    handledExportRequestRef.current = exportRequest;
    let cancelled = false;
    (async () => {
      try {
        const dataUrl = await exportSlideToDataUrl(config, slide, assetSourceLookup);
        if (!cancelled) {
          onExportReady(dataUrl);
        }
      } catch (error) {
        console.error("[screenshots] export failed", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assetSourceLookup, config, exportRequest, onExportReady, slide]);

  if (!slide) {
    return <div className="flex flex-1 items-center justify-center text-gray-400">No page selected</div>;
  }

  if (!isClient) {
    return <div className="flex flex-1 items-center justify-center text-gray-400">Loading canvas...</div>;
  }

  const sortedLayers = [...slide.layers].sort((left, right) => left.zIndex - right.zIndex);
  const imageOverlayLayers = sortedLayers.filter((layer): layer is Extract<Layer, { type: "image" }> => {
    return layer.type === "image" && layer.visible && Boolean(layer.assetRef);
  });
  const containerWidth = 800;
  const containerHeight = 600;
  const scale = Math.min(containerWidth / config.exportedPngSize.w, containerHeight / config.exportedPngSize.h, 0.5);

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto bg-[#ece9df] p-6">
      <div
        className="relative"
        style={{
          width: config.exportedPngSize.w * scale,
          height: config.exportedPngSize.h * scale,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <Stage
          ref={canvasRef}
          width={config.exportedPngSize.w}
          height={config.exportedPngSize.h}
          scale={{ x: scale, y: scale }}
        >
          <KonvaLayer>
            {sortedLayers.map((layer) => (
              <LayerRenderer
                key={layer.id}
                assetSources={assetSourceLookup}
                canvasSize={config.exportedPngSize}
                debugMode={debugMode}
                layer={layer}
                onAssetDebugChange={handleAssetDebugChange}
                onPreviewFrameChange={handleOverlayFrameChange}
                onSelectLayer={onSelectLayer}
                onUpdateLayer={onUpdateLayer}
                selectedLayerId={selectedLayerId}
              />
            ))}

            <Transformer
              ref={transformerRef}
              stroke="#eab308"
              strokeWidth={2}
              dash={[5, 5]}
              anchorStroke="#eab308"
              anchorFill="#ffffff"
              anchorSize={8}
              borderStroke="#eab308"
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              onTransform={() => {
                const node = transformerRef.current?.nodes?.()?.[0];
                if (!node || !selectedLayerId) {
                  return;
                }

                const layer = sortedLayers.find((current) => current.id === selectedLayerId);
                if (!layer || layer.type !== "image") {
                  return;
                }

                handleOverlayFrameChange(layer.id, {
                  x: node.x(),
                  y: node.y(),
                  width: Math.max(10, layer.width * node.scaleX()),
                  height: Math.max(10, layer.height * node.scaleY()),
                  rotation: node.rotation(),
                  opacity: layer.opacity ?? 1,
                });
              }}
              onTransformEnd={() => {
                const node = transformerRef.current?.nodes?.()?.[0];
                if (!node || !selectedLayerId) {
                  return;
                }

                const layer = sortedLayers.find((current) => current.id === selectedLayerId);
                if (!layer || layer.type === "background") {
                  return;
                }

                const nextWidth = Math.max(10, layer.width * node.scaleX());
                const nextHeight = Math.max(10, layer.height * node.scaleY());

                node.scaleX(1);
                node.scaleY(1);

                onUpdateLayer({
                  ...layer,
                  x: node.x(),
                  y: node.y(),
                  width: nextWidth,
                  height: nextHeight,
                  rotation: node.rotation(),
                });
                handleOverlayFrameChange(layer.id, null);
              }}
            />
          </KonvaLayer>
        </Stage>

        {imageOverlayLayers.map((layer) => {
          const source = assetSourceLookup[layer.assetRef];
          if (!source) {
            return null;
          }
          const frame = overlayFrames[layer.id] || {
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
            rotation: layer.rotation || 0,
            opacity: layer.opacity ?? 1,
          };

          return (
            <img
              key={`overlay-${layer.id}`}
              src={source}
              alt=""
              draggable={false}
              className="pointer-events-none absolute select-none"
              style={{
                left: frame.x * scale,
                top: frame.y * scale,
                width: frame.width * scale,
                height: frame.height * scale,
                opacity: frame.opacity,
                borderRadius: (layer.cornerRadius || 0) * scale,
                objectFit: layer.fit === "fill" ? "fill" : layer.fit,
                transform: `rotate(${frame.rotation}deg)`,
                transformOrigin: "top left",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
