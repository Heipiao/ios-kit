"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  ImagePlus,
  Layers3,
  Palette,
  Sparkles,
  Undo2,
  Redo2,
  Upload,
  Plus,
  Trash2,
  X,
  Save,
  Wand2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { AiLayerTreeConfig, Layer, TextLayer } from "@/lib/layer-tree-types";
import {
  MOCK_LAYER_TREE_CONFIG,
  FRAME_REGISTRY,
  generateId,
  createDefaultLayer,
} from "@/lib/layer-tree-mock";
import { Stage, Layer as KonvaLayer, Rect, Text, Circle, Group, Image as KonvaImage, Transformer } from "react-konva";
import { getProject, type Project, type Asset, saveScreenshotConfig, generateScreenshotWithAI } from "@/lib/api-projects";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ScreenshotAsset {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

type DeviceType = "iphone_65" | "iphone_67" | "iphone_55" | "ipad_129" | "ipad_11" | "ipad_109";

// ─────────────────────────────────────────────────────────────────────────────
// Canvas Panel (Konva)
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasPanelProps {
  config: AiLayerTreeConfig;
  slideIndex: number;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (layer: Layer) => void;
  exportRequest: number;
  onExportReady: (dataUrl: string) => void;
  uploads: ScreenshotAsset[];
}

function CanvasPanel({
  config,
  slideIndex,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  exportRequest,
  onExportReady,
  uploads,
}: CanvasPanelProps) {
  const canvasRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const imagePromises = uploads.map((upload) => {
      return new Promise<void>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [upload.id]: img }));
          resolve();
        };
        img.onerror = () => resolve();
        img.src = upload.dataUrl;
      });
    });

    Promise.all(imagePromises).catch(() => {});
  }, [isClient, uploads]);

  // Attach transformer to selected node
  useEffect(() => {
    if (!isClient || !transformerRef.current || !canvasRef.current) return;

    const stage = canvasRef.current.getStage();
    if (!stage) return;

    const selectedNode = stage.findOne(`#${selectedLayerId}`);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isClient, selectedLayerId, config]);

  useEffect(() => {
    if (exportRequest > 0 && canvasRef.current) {
      const stage = canvasRef.current.getStage();
      if (stage) {
        // Hide transformer before export
        if (transformerRef.current) {
          transformerRef.current.hide();
        }
        const dataUrl = stage.toDataURL({ mimeType: "image/png", quality: 1 });
        onExportReady(dataUrl);
        // Show transformer after export
        if (transformerRef.current) {
          transformerRef.current.show();
        }
      }
    }
  }, [exportRequest, onExportReady]);

  const slide = config.slides[slideIndex];
  if (!slide) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">No page selected</div>;
  }

  if (!isClient) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading canvas...</div>;
  }

  const sortedLayers = [...slide.layers].sort((a, b) => a.zIndex - b.zIndex);

  const containerWidth = 800;
  const containerHeight = 600;
  const scaleX = containerWidth / config.exportedPngSize.w;
  const scaleY = containerHeight / config.exportedPngSize.h;
  const scale = Math.min(scaleX, scaleY, 0.5);

  return (
    <div className="flex-1 flex items-center justify-center overflow-auto bg-[#ece9df] p-6">
      <div
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
            {sortedLayers.map((layer) => {
              if (!layer.visible) return null;

              if (layer.type === "background") {
                // Background layer: always fills the entire canvas, cannot be selected/edited
                if (layer.bgType === "solid") {
                  return (
                    <Rect
                      key={layer.id}
                      id={layer.id}
                      x={0}
                      y={0}
                      width={config.exportedPngSize.w}
                      height={config.exportedPngSize.h}
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
                      key={layer.id}
                      id={layer.id}
                      x={0}
                      y={0}
                      width={config.exportedPngSize.w}
                      height={config.exportedPngSize.h}
                      fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                      fillLinearGradientEndPoint={{ x: config.exportedPngSize.w, y: config.exportedPngSize.h }}
                      fillLinearGradientColorStops={[0, startColor, 1, endColor]}
                      opacity={layer.opacity}
                      rotation={layer.rotation}
                      listening={false}
                    />
                  );
                }
                return null;
              }

              if (layer.type === "image") {
                const uploadedImage = layer.assetRef ? loadedImages[layer.assetRef] : null;

                return (
                  <Group
                    key={layer.id}
                    id={layer.id}
                    x={layer.x}
                    y={layer.y}
                    rotation={layer.rotation}
                    opacity={layer.opacity}
                    draggable
                    onDragEnd={(e) => {
                      onUpdateLayer({
                        ...layer,
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                  >
                    <Group
                      clipFunc={(ctx) => {
                        const r = layer.cornerRadius || 0;
                        ctx.beginPath();
                        ctx.roundRect(0, 0, layer.width, layer.height, r);
                        ctx.closePath();
                      }}
                    >
                      {uploadedImage ? (
                        <KonvaImage
                          image={uploadedImage}
                          x={0}
                          y={0}
                          width={layer.width}
                          height={layer.height}
                        />
                      ) : (
                        <Rect
                          width={layer.width}
                          height={layer.height}
                          fill="#4a5568"
                        />
                      )}
                    </Group>
                    <Rect
                      width={layer.width}
                      height={layer.height}
                      fill="none"
                      stroke="#1a202c"
                      strokeWidth={1}
                      cornerRadius={layer.cornerRadius || 0}
                      onClick={() => onSelectLayer(layer.id)}
                    />
                  </Group>
                );
              }

              if (layer.type === "text") {
                return (
                  <Text
                    key={layer.id}
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
                    onDragEnd={(e) => {
                      onUpdateLayer({
                        ...layer,
                        x: e.target.x(),
                        y: e.target.y(),
                      });
                    }}
                    onClick={() => onSelectLayer(layer.id)}
                  />
                );
              }

              if (layer.type === "sticker") {
                return (
                  <Group
                    key={layer.id}
                    id={layer.id}
                    x={layer.x + layer.width / 2}
                    y={layer.y + layer.height / 2}
                    rotation={layer.rotation}
                    opacity={layer.opacity}
                    draggable
                    onDragEnd={(e) => {
                      onUpdateLayer({
                        ...layer,
                        x: e.target.x() - layer.width / 2,
                        y: e.target.y() - layer.height / 2,
                      });
                    }}
                  >
                    <Circle
                      x={0}
                      y={0}
                      radius={Math.min(layer.width, layer.height) / 2}
                      fill="#fbbf24"
                      onClick={() => onSelectLayer(layer.id)}
                    />
                  </Group>
                );
              }

              return null;
            })}

            {/* Transformer for drag/resize with yellow dashed border */}
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
              onTransformEnd={(e) => {
                const transformer = e.target as any;
                const node = transformer.nodes()[0];
                if (!node || !selectedLayerId) return;

                const layer = sortedLayers.find((l) => l.id === selectedLayerId);
                if (!layer || layer.type === "background") return;

                const stage = canvasRef.current.getStage();
                const scale = stage?.scaleX() || 1;

                onUpdateLayer({
                  ...layer,
                  x: node.x(),
                  y: node.y(),
                  width: Math.max(10, node.width() / scale),
                  height: Math.max(10, node.height() / scale),
                  rotation: node.rotation(),
                });
              }}
            />
          </KonvaLayer>
        </Stage>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Property Panel (Right Sidebar)
// ─────────────────────────────────────────────────────────────────────────────

interface PropertyPanelProps {
  layer: Layer | null;
  onChange: (layer: Layer) => void;
  onDelete: () => void;
}

function PropertyPanel({ layer, onChange, onDelete }: PropertyPanelProps) {
  if (!layer) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center py-8">
          <Palette className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-mono uppercase tracking-wider text-gray-500">Select a layer to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <h2 className="font-display text-sm uppercase tracking-wider">Inspector: {layer.type.toUpperCase()}</h2>
        </div>
        {layer.type !== "background" && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-2 py-1 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold uppercase"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
      </div>

      <section>
        <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-2">Position</span>
        {layer.type === "background" ? (
          <p className="text-xs font-mono text-gray-400 py-2">
            Background layer fills the entire canvas and cannot be repositioned.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">X</span>
                <input
                  type="number"
                  value={layer.x}
                  onChange={(e) => onChange({ ...layer, x: Number(e.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Y</span>
                <input
                  type="number"
                  value={layer.y}
                  onChange={(e) => onChange({ ...layer, y: Number(e.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Width</span>
                <input
                  type="number"
                  value={layer.width}
                  onChange={(e) => onChange({ ...layer, width: Number(e.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Height</span>
                <input
                  type="number"
                  value={layer.height}
                  onChange={(e) => onChange({ ...layer, height: Number(e.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          </>
        )}
      </section>

      <section>
        <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-2">Transform</span>
        <label className="block mb-2">
          <span className="text-[10px] font-mono uppercase text-gray-500">Rotation: {layer.rotation || 0}°</span>
          <input
            type="range"
            min={0}
            max={360}
            value={layer.rotation || 0}
            onChange={(e) => onChange({ ...layer, rotation: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer border border-black"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-mono uppercase text-gray-500">Opacity: {Math.round((layer.opacity || 1) * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={layer.opacity || 1}
            onChange={(e) => onChange({ ...layer, opacity: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer border border-black"
          />
        </label>
      </section>

      {layer.type === "background" && (
        <section>
          <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-2">Background</span>
          <label className="block mb-2">
            <span className="text-[10px] font-mono uppercase text-gray-500">Type</span>
            <select
              value={layer.bgType}
              onChange={(e) => onChange({ ...layer, bgType: e.target.value as any })}
              className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm bg-white"
            >
              <option value="solid">Solid</option>
              <option value="gradient">Gradient</option>
            </select>
          </label>
          {layer.bgType === "solid" && (
            <label className="block">
              <span className="text-[10px] font-mono uppercase text-gray-500">Color</span>
              <input
                type="color"
                value={layer.color || "#667eea"}
                onChange={(e) => onChange({ ...layer, color: e.target.value })}
                className="mt-1 w-full h-10 border-2 border-black cursor-pointer"
              />
            </label>
          )}
        </section>
      )}

      {layer.type === "image" && (
        <section>
          <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-2">Image</span>
          <label className="block mb-2">
            <span className="text-[10px] font-mono uppercase text-gray-500">Corner Radius</span>
            <input
              type="number"
              value={layer.cornerRadius || 0}
              onChange={(e) => onChange({ ...layer, cornerRadius: Number(e.target.value) })}
              className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
            />
          </label>
        </section>
      )}

      {layer.type === "text" && (
        <section>
          <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-2">Text</span>
          <label className="block mb-2">
            <span className="text-[10px] font-mono uppercase text-gray-500">Content</span>
            <textarea
              value={(layer as any).content}
              onChange={(e) => onChange({ ...layer, content: e.target.value })}
              rows={3}
              className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block mb-2">
            <span className="text-[10px] font-mono uppercase text-gray-500">Color</span>
            <input
              type="color"
              value={(layer as any).color || "#ffffff"}
              onChange={(e) => onChange({ ...layer, color: e.target.value })}
              className="mt-1 w-full h-10 border-2 border-black cursor-pointer"
            />
          </label>
          <label className="block mb-2">
            <span className="text-[10px] font-mono uppercase text-gray-500">Font Size</span>
            <input
              type="number"
              value={(layer as any).fontSize || 32}
              onChange={(e) => onChange({ ...layer, fontSize: Number(e.target.value) })}
              className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
            />
          </label>
        </section>
      )}
    </div>
  );
}
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ios-kit";
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer List Component
// ─────────────────────────────────────────────────────────────────────────────

interface LayerListProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayerUp: (id: string) => void;
  onMoveLayerDown: (id: string) => void;
  onAddLayer: (type: Layer["type"]) => void;
}

function LayerList({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onAddLayer,
}: LayerListProps) {
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="border-t-2 border-black p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers3 className="w-4 h-4" />
          <h2 className="font-display text-sm uppercase tracking-wider">Layers</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddLayer("background")}
            className="p-1 hover:bg-yellow-100 border border-black"
            title="Add Background Layer"
          >
            <span className="text-xs font-bold">BG</span>
          </button>
          <button
            onClick={() => onAddLayer("image")}
            className="p-1 hover:bg-yellow-100 border border-black"
            title="Add Image Layer"
          >
            <span className="text-xs font-bold">IMG</span>
          </button>
          <button
            onClick={() => onAddLayer("text")}
            className="p-1 hover:bg-yellow-100 border border-black"
            title="Add Text Layer"
          >
            <span className="text-xs font-bold">T</span>
          </button>
          <button
            onClick={() => onAddLayer("sticker")}
            className="p-1 hover:bg-yellow-100 border border-black"
            title="Add Sticker Layer"
          >
            <span className="text-xs font-bold">★</span>
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {sortedLayers.map((layer, index) => {
          const isBackground = layer.type === "background";

          return (
            <div
              key={layer.id}
              className={`flex items-center gap-2 p-2 border-2 transition-colors ${
                selectedLayerId === layer.id
                  ? "border-black bg-black text-white"
                  : "border-black bg-gray-50 hover:bg-yellow-50"
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className="p-0.5 hover:opacity-70"
              >
                {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              <span className="text-xs font-bold w-6 text-center uppercase">
                {layer.type === "background" ? "BG" : layer.type === "image" ? "IMG" : layer.type === "text" ? "T" : "★"}
              </span>

              <span className="text-xs font-mono flex-1 truncate">
                {layer.type === "text" ? (layer as TextLayer).content.slice(0, 20) : `${layer.type} #${index + 1}`}
              </span>

              {/* Move buttons - disabled for background layer */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayerUp(layer.id);
                  }}
                  className="p-0.5 hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={index === sortedLayers.length - 1 || isBackground}
                  title={isBackground ? "Background layer cannot be moved" : "Move up"}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayerDown(layer.id);
                  }}
                  className="p-0.5 hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={index === 0 || isBackground}
                  title={isBackground ? "Background layer cannot be moved" : "Move down"}
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Delete button - disabled for background layer */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLayer(layer.id);
                }}
                className="p-0.5 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={isBackground}
                title={isBackground ? "Background layer cannot be deleted" : "Delete"}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {sortedLayers.length === 0 && (
        <p className="text-xs font-mono text-gray-400 text-center py-4">
          No layers yet. Click + to add one.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ScreenshotEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploads, setUploads] = useState<ScreenshotAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LayerTree Config State
  const [config, setConfig] = useState<AiLayerTreeConfig>(MOCK_LAYER_TREE_CONFIG);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Undo/Redo History
  const [history, setHistory] = useState<AiLayerTreeConfig[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [exportRequest, setExportRequest] = useState(0);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data.project);
      setAssets(data.assets);

      // Convert assets to ScreenshotAsset
      const screenshots = data.assets.filter((a) => a.type === "screenshot");
      const screenshotAssets: ScreenshotAsset[] = screenshots.map((s) => ({
        id: s.id,
        name: s.filename,
        dataUrl: s.storageUrl,
        width: s.width || 1284,
        height: s.height || 2778,
      }));
      setUploads(screenshotAssets);

      // Initialize LayerTree config from uploads
      if (screenshots.length > 0) {
        const newSlides = screenshots.map((upload, index) => ({
          slideId: generateId("slide"),
          name: `${data.project.name} - Screen ${index + 1}`,
          layers: [
            {
              id: generateId("bg"),
              type: "background" as const,
              visible: true,
              zIndex: 0,
              x: 0,
              y: 0,
              width: 1206,
              height: 2622,
              bgType: "gradient" as const,
              gradient: {
                type: "linear" as const,
                stops: [
                  { offset: 0, color: "#667eea" },
                  { offset: 1, color: "#764ba2" },
                ],
              },
            },
            {
              id: generateId("img"),
              type: "image" as const,
              visible: true,
              zIndex: 1,
              x: 397,
              y: 370,
              width: 412,
              height: 878,
              assetRef: upload.id,
              fit: "cover" as const,
              cornerRadius: 47,
              showDeviceFrame: true,
              frameRef: "iphone-17-pro-silver",
            },
            {
              id: generateId("text"),
              type: "text" as const,
              visible: true,
              zIndex: 2,
              x: 100,
              y: 2350,
              width: 1006,
              height: 120,
              content: `${data.project.name} - Feature ${index + 1}`,
              fontFamily: "SF Pro Display",
              fontSize: 48,
              fontWeight: "600" as const,
              color: "#ffffff",
              align: "center" as const,
            },
          ] as Layer[],
        }));

        const newConfig: AiLayerTreeConfig = {
          version: "1.0",
          exportedPngSize: { w: 1206, h: 2622 },
          device: { frameRef: "iphone-17-pro-silver" },
          slides: newSlides,
        };
        setConfig(newConfig);
        setHistory([newConfig]);
        setHistoryIndex(0);
      }

      setError(null);
    } catch (err) {
      setError("Failed to load project");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const currentSlide = config.slides[currentSlideIndex];
  const selectedLayer = currentSlide?.layers.find((l) => l.id === selectedLayerId) || null;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setConfig(history[historyIndex + 1]);
          }
        } else {
          if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setConfig(history[historyIndex - 1]);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, historyIndex]);

  const addToHistory = useCallback((newConfig: AiLayerTreeConfig) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newConfig);
      return newHistory.slice(-50);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const updateLayer = useCallback((updatedLayer: Layer) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        slides: prev.slides.map((slide, i) =>
          i === currentSlideIndex
            ? { ...slide, layers: slide.layers.map((l) => (l.id === updatedLayer.id ? updatedLayer : l)) }
            : slide
        ),
      };
      addToHistory(newConfig);
      return newConfig;
    });
  }, [currentSlideIndex, addToHistory]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        slides: prev.slides.map((slide, i) =>
          i === currentSlideIndex
            ? { ...slide, layers: slide.layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)) }
            : slide
        ),
      };
      addToHistory(newConfig);
      return newConfig;
    });
  }, [currentSlideIndex, addToHistory]);

  const moveLayerUp = useCallback((layerId: string) => {
    setConfig((prev) => {
      const slide = prev.slides[currentSlideIndex];
      if (!slide) return prev;
      const layers = [...slide.layers];
      const index = layers.findIndex((l) => l.id === layerId);
      const layer = layers[index];
      // Cannot move background layer
      if (layer?.type === "background") return prev;
      if (index === -1 || index >= layers.length - 1) return prev;
      const temp = layers[index].zIndex;
      layers[index].zIndex = layers[index + 1].zIndex;
      layers[index + 1].zIndex = temp;
      return { ...prev, slides: prev.slides.map((s, i) => (i === currentSlideIndex ? { ...slide, layers } : s)) };
    });
  }, [currentSlideIndex]);

  const moveLayerDown = useCallback((layerId: string) => {
    setConfig((prev) => {
      const slide = prev.slides[currentSlideIndex];
      if (!slide) return prev;
      const layers = [...slide.layers];
      const index = layers.findIndex((l) => l.id === layerId);
      const layer = layers[index];
      // Cannot move background layer
      if (layer?.type === "background") return prev;
      if (index === -1 || index === 0) return prev;
      const temp = layers[index].zIndex;
      layers[index].zIndex = layers[index - 1].zIndex;
      layers[index - 1].zIndex = temp;
      return { ...prev, slides: prev.slides.map((s, i) => (i === currentSlideIndex ? { ...slide, layers } : s)) };
    });
  }, [currentSlideIndex]);

  const addLayer = useCallback((type: Layer["type"]) => {
    // Prevent adding background layer - it's automatically created for each slide
    if (type === "background") {
      alert("Background layer is automatically created for each slide");
      return;
    }

    // Calculate the next zIndex (should be higher than all existing layers)
    const slide = config.slides[currentSlideIndex];
    const maxZIndex = slide ? Math.max(...slide.layers.map((l) => l.zIndex)) : 0;

    const newLayer = createDefaultLayer(type, maxZIndex + 1);
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        slides: prev.slides.map((slide, i) =>
          i === currentSlideIndex ? { ...slide, layers: [...slide.layers, newLayer] } : slide
        ),
      };
      addToHistory(newConfig);
      return newConfig;
    });
    setSelectedLayerId(newLayer.id);
  }, [currentSlideIndex, config, addToHistory]);

  const handleExportReady = async (dataUrl: string) => {
    // Download the exported image
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${sanitizeFilename(project?.name || "screenshot")}-page-${currentSlideIndex + 1}.png`;
    link.click();

    // Optionally save to backend
    // await saveScreenshotConfig(projectId, config, "user_edited");
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setConfig(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setConfig(history[historyIndex + 1]);
    }
  };

  const handleSave = async () => {
    try {
      await saveScreenshotConfig(projectId, config, "user_edited");
      alert("Saved!");
    } catch (err) {
      alert("Failed to save");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono uppercase tracking-wider">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-mono text-red-600 mb-4">{error || "Project not found"}</p>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-yellow-50 transition-colors text-sm font-bold uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Panel - Project Info */}
      <aside className="w-64 border-r-2 border-black bg-white flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b-2 border-black bg-yellow-400">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-1 text-xs font-mono uppercase hover:underline"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>
          <h1 className="text-sm font-display font-bold uppercase tracking-wider mt-2">{project.name}</h1>
          <p className="text-[10px] font-mono uppercase text-gray-600">{uploads.length} screenshots</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {uploads.map((upload, index) => (
              <button
                key={upload.id}
                onClick={() => {
                  setCurrentSlideIndex(index);
                  setSelectedLayerId(null);
                }}
                className={`border-2 transition-colors ${
                  currentSlideIndex === index
                    ? "border-black bg-black"
                    : "border-black bg-gray-50 hover:bg-yellow-50"
                }`}
              >
                <div className="aspect-[9/16] overflow-hidden">
                  <img src={upload.dataUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className={`text-[10px] font-mono uppercase py-1 ${
                  currentSlideIndex === index ? "text-white" : "text-gray-600"
                }`}>
                  #{index + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="h-16 border-b-2 border-black bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-black transition-colors ${
                historyIndex <= 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-yellow-50"
              }`}
            >
              <Undo2 className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Undo</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-black transition-colors ${
                historyIndex >= history.length - 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-yellow-50"
              }`}
            >
              <Redo2 className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Redo</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-yellow-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Save</span>
            </button>
            <button
              onClick={() => setExportRequest((r) => r + 1)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-black text-white hover:bg-red-500 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Export PNG</span>
            </button>
          </div>
        </header>

        {/* Canvas */}
        <CanvasPanel
          config={config}
          slideIndex={currentSlideIndex}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={updateLayer}
          exportRequest={exportRequest}
          onExportReady={handleExportReady}
          uploads={uploads}
        />
      </main>

      {/* Right Panel */}
      <aside className="w-80 border-l-2 border-black bg-white flex flex-col h-full overflow-hidden">
        {/* Layer List */}
        {currentSlide && (
          <LayerList
            layers={currentSlide.layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onToggleVisibility={toggleLayerVisibility}
            onDeleteLayer={(layerId) => {
              // Prevent deleting background layer
              const layerToDelete = currentSlide.layers.find((l) => l.id === layerId);
              if (layerToDelete?.type === "background") {
                alert("Background layer cannot be deleted");
                return;
              }
              if (selectedLayerId === layerId) setSelectedLayerId(null);
              setConfig((prev) => ({
                ...prev,
                slides: prev.slides.map((slide, i) =>
                  i === currentSlideIndex ? { ...slide, layers: slide.layers.filter((l) => l.id !== layerId) } : slide
                ),
              }));
              addToHistory({
                ...config,
                slides: config.slides.map((slide, i) =>
                  i === currentSlideIndex ? { ...slide, layers: slide.layers.filter((l) => l.id !== layerId) } : slide
                ),
              });
            }}
            onMoveLayerUp={moveLayerUp}
            onMoveLayerDown={moveLayerDown}
            onAddLayer={addLayer}
          />
        )}

        {/* Property Panel */}
        <div className="flex-1 overflow-hidden">
          <PropertyPanel layer={selectedLayer} onChange={updateLayer} onDelete={() => {}} />
        </div>

        {/* Next Up Section */}
        <div className="border-t-2 border-black p-4 bg-black text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-display text-sm uppercase">Next Up</h3>
          </div>
          <ul className="text-xs space-y-1.5 opacity-80">
            <li>• AI-powered layer refinement</li>
            <li>• Batch export all pages</li>
            <li>• Direct upload to App Store</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
