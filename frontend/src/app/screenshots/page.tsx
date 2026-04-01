"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Download, ImagePlus, Layers3, Palette, Sparkles, Undo2, Redo2, Upload, Plus, Trash2, X, Save, Wand2, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { AiLayerTreeConfig, Layer, TextLayer } from "@/lib/layer-tree-types";
import { MOCK_LAYER_TREE_CONFIG, FRAME_REGISTRY, generateId, createDefaultLayer } from "@/lib/layer-tree-mock";
import { Stage, Layer as KonvaLayer, Rect, Text, Circle, Group, Image as KonvaImage } from "react-konva";

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

type DeviceType = 'iphone_65' | 'iphone_67' | 'iphone_55' | 'ipad_129' | 'ipad_11' | 'ipad_109';

const DEVICE_PRESETS: Record<DeviceType, { label: string; width: number; height: number }> = {
  iphone_65: { label: 'iPhone 6.5"', width: 1284, height: 2778 },
  iphone_67: { label: 'iPhone 6.7"', width: 1290, height: 2796 },
  iphone_55: { label: 'iPhone 5.5"', width: 1242, height: 2208 },
  ipad_129: { label: 'iPad 12.9"', width: 2048, height: 2732 },
  ipad_11: { label: 'iPad 11"', width: 1668, height: 2388 },
  ipad_109: { label: 'iPad 10.9"', width: 1640, height: 2360 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = reject;
    image.src = src;
  });
}

async function fileToAsset(file: File): Promise<ScreenshotAsset> {
  const dataUrl = await readFileAsDataUrl(file);
  const size = await loadImageSize(dataUrl);
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    dataUrl,
    width: size.width,
    height: size.height,
  };
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ios-kit';
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Panel (Left Sidebar)
// ─────────────────────────────────────────────────────────────────────────────

interface ProjectPanelProps {
  appName: string;
  description: string;
  deviceType: DeviceType;
  uploads: ScreenshotAsset[];
  logoAsset: ScreenshotAsset | null;
  slides: { slideId: string; name?: string }[];
  currentSlideIndex: number;
  onAppNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onDeviceTypeChange: (type: DeviceType) => void;
  onUploadFiles: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onLogoFile: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveUpload: (id: string) => void;
  onRemoveLogo: () => void;
  onSelectSlide: (index: number) => void;
  onGenerateDraft: () => void;
}

function ProjectPanel({
  appName,
  description,
  deviceType,
  uploads,
  logoAsset,
  slides,
  currentSlideIndex,
  onAppNameChange,
  onDescriptionChange,
  onDeviceTypeChange,
  onUploadFiles,
  onLogoFile,
  onRemoveUpload,
  onRemoveLogo,
  onSelectSlide,
  onGenerateDraft,
}: ProjectPanelProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploadError(null);
    try {
      await onUploadFiles(event);
    } catch {
      setUploadError('Failed to read some files');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <aside className="w-80 border-r-2 border-black bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-2 border-black bg-yellow-400">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center">
            <span className="text-xl">📱</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold uppercase tracking-wider leading-none">iOS Kit</h1>
            <p className="text-xs font-mono uppercase tracking-widest leading-none mt-1">LayerTree Editor</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Project Settings */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4" />
            <h2 className="font-display text-sm uppercase tracking-wider">Project Settings</h2>
          </div>

          <label className="block mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">App Name</span>
            <input
              value={appName}
              onChange={(e) => onAppNameChange(e.target.value)}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm font-medium"
              placeholder="Enter app name"
            />
          </label>

          <label className="block mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Description</span>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm leading-relaxed"
              placeholder="Describe your app's core value"
            />
          </label>

          <label className="block">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Device</span>
            <select
              value={deviceType}
              onChange={(e) => onDeviceTypeChange(e.target.value as DeviceType)}
              className="mt-1 w-full border-2 border-black px-3 py-2 text-sm font-medium bg-white"
            >
              {Object.entries(DEVICE_PRESETS).map(([value, preset]) => (
                <option key={value} value={value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {/* Uploads */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ImagePlus className="w-4 h-4" />
            <h2 className="font-display text-sm uppercase tracking-wider">Assets</h2>
          </div>

          {/* Screenshot Upload */}
          <label className="block border-2 border-dashed border-black p-3 cursor-pointer hover:bg-yellow-50 transition-colors mb-3">
            <span className="flex items-center justify-center gap-2 font-display uppercase text-sm">
              <Upload className="w-4 h-4" />
              Add Screenshots
            </span>
            <input className="hidden" type="file" accept="image/*" multiple onChange={handleUploadFiles} />
          </label>

          {/* Logo Upload */}
          {!logoAsset ? (
            <label className="block border-2 border-dashed border-black p-3 cursor-pointer hover:bg-teal-50 transition-colors">
              <span className="flex items-center justify-center gap-2 font-display uppercase text-sm">
                <ImagePlus className="w-4 h-4" />
                Add Logo (Optional)
              </span>
              <input className="hidden" type="file" accept="image/*" onChange={onLogoFile} />
            </label>
          ) : (
            <div className="border-2 border-black p-2 bg-teal-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logoAsset.dataUrl} alt="Logo" className="w-8 h-8 object-contain" />
                <span className="text-xs font-mono uppercase truncate max-w-[120px]">{logoAsset.name}</span>
              </div>
              <button onClick={onRemoveLogo} className="text-xs font-bold hover:text-red-600">✕</button>
            </div>
          )}

          {/* Uploaded Screenshots List */}
          {uploads.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500">{uploads.length} Screenshots</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {uploads.map((upload, index) => (
                  <div key={upload.id} className="border-2 border-black p-2 bg-gray-50 flex items-center justify-between group">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold shrink-0">#{index + 1}</span>
                      <img src={upload.dataUrl} alt="" className="w-8 h-8 object-cover border border-gray-300" />
                      <span className="text-xs font-mono truncate max-w-[140px]">{upload.name}</span>
                    </div>
                    <button
                      onClick={() => onRemoveUpload(upload.id)}
                      className="p-1 hover:text-red-600"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadError && (
            <p className="mt-2 text-xs text-red-600 font-mono">{uploadError}</p>
          )}
        </section>

        {/* Generate Draft Button */}
        <section>
          <button
            onClick={onGenerateDraft}
            disabled={uploads.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 transition-colors font-display uppercase text-sm font-bold ${
              uploads.length === 0
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border-black bg-black text-white hover:bg-red-500'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Generate Draft with AI
          </button>
        </section>

        {/* Pages Navigation */}
        {slides.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Layers3 className="w-4 h-4" />
              <h2 className="font-display text-sm uppercase tracking-wider">Pages ({slides.length})</h2>
            </div>
            <div className="space-y-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.slideId}
                  onClick={() => onSelectSlide(index)}
                  className={`w-full text-left px-3 py-2 border-2 transition-colors text-xs ${
                    index === currentSlideIndex
                      ? 'border-black bg-black text-white'
                      : 'border-black bg-gray-50 hover:bg-yellow-50'
                  }`}
                >
                  <span className="font-bold uppercase">Page {index + 1}</span>
                  <span className="block font-mono truncate mt-1 opacity-75">{slide.name || 'Untitled'}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

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
}: CanvasPanelProps & { uploads: ScreenshotAsset[] }) {
  const canvasRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load images for Konva
  useEffect(() => {
    if (!isClient) return;

    const imagePromises = uploads.map((upload) => {
      return new Promise<void>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
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

  // Handle export
  useEffect(() => {
    if (exportRequest > 0 && canvasRef.current) {
      const stage = canvasRef.current.getStage();
      if (stage) {
        const dataUrl = stage.toDataURL({ mimeType: 'image/png', quality: 1 });
        onExportReady(dataUrl);
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

  // Calculate scale to fit canvas
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
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
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

              // Background Layer
              if (layer.type === 'background') {
                if (layer.bgType === 'solid') {
                  return (
                    <Rect
                      key={layer.id}
                      x={layer.x}
                      y={layer.y}
                      width={layer.width}
                      height={layer.height}
                      fill={layer.color}
                      opacity={layer.opacity}
                      rotation={layer.rotation}
                    />
                  );
                }
                if (layer.bgType === 'gradient' && layer.gradient) {
                  const startColor = layer.gradient.stops[0]?.color || '#667eea';
                  const endColor = layer.gradient.stops[1]?.color || '#764ba2';
                  return (
                    <Rect
                      key={layer.id}
                      x={layer.x}
                      y={layer.y}
                      width={layer.width}
                      height={layer.height}
                      fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                      fillLinearGradientEndPoint={{ x: config.exportedPngSize.w, y: config.exportedPngSize.h }}
                      fillLinearGradientColorStops={[0, startColor, 1, endColor]}
                      opacity={layer.opacity}
                      rotation={layer.rotation}
                    />
                  );
                }
                return null;
              }

              // Image Layer
              if (layer.type === 'image') {
                const uploadedImage = layer.assetRef ? loadedImages[layer.assetRef] : null;

                return (
                  <Group
                    key={layer.id}
                    x={layer.x}
                    y={layer.y}
                    rotation={layer.rotation}
                    opacity={layer.opacity}
                  >
                    {/* Clipped image with corner radius */}
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
                    {/* Border */}
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

              // Text Layer
              if (layer.type === 'text') {
                return (
                  <Text
                    key={layer.id}
                    x={layer.x}
                    y={layer.y}
                    text={layer.content}
                    fontSize={layer.fontSize}
                    fill={layer.color}
                    align={layer.align}
                    width={layer.width}
                    height={layer.height}
                    fontFamily={layer.fontFamily}
                    fontStyle={layer.fontWeight === 'bold' || layer.fontWeight === '700' ? 'bold' : layer.fontWeight === '600' ? '600' : 'normal'}
                    opacity={layer.opacity}
                    rotation={layer.rotation}
                    onClick={() => onSelectLayer(layer.id)}
                  />
                );
              }

              // Sticker Layer
              if (layer.type === 'sticker') {
                return (
                  <Circle
                    key={layer.id}
                    x={layer.x + layer.width / 2}
                    y={layer.y + layer.height / 2}
                    radius={Math.min(layer.width, layer.height) / 2}
                    fill="#fbbf24"
                    opacity={layer.opacity}
                    rotation={layer.rotation}
                    onClick={() => onSelectLayer(layer.id)}
                  />
                );
              }

              return null;
            })}

            {/* Selection box */}
            {selectedLayerId && (
              (() => {
                const layer = sortedLayers.find((l) => l.id === selectedLayerId);
                if (!layer) return null;
                return (
                  <Rect
                    x={layer.x - 2}
                    y={layer.y - 2}
                    width={layer.width + 4}
                    height={layer.height + 4}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dash={[5, 5]}
                    listening={false}
                  />
                );
              })()
            )}
          </KonvaLayer>
        </Stage>
      </div>
    </div>
  );
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
            onClick={() => onAddLayer('background')}
            className="p-1 hover:bg-yellow-100 border border-black"
            title="Add Background Layer"
          >
            <span className="text-xs font-bold">BG</span>
          </button>
          <button
            onClick={() => onAddLayer('image')}
            className="p-1 hover:bg-yellow-100 border border-black"
            title="Add Image Layer"
          >
            <span className="text-xs font-bold">IMG</span>
          </button>
          <button
            onClick={() => onAddLayer('text')}
            className="p-1 hover:bg-yellow-100 border border-black"
            title="Add Text Layer"
          >
            <span className="text-xs font-bold">T</span>
          </button>
          <button
            onClick={() => onAddLayer('sticker')}
            className="p-1 hover:bg-yellow-100 border border-black"
            title="Add Sticker Layer"
          >
            <span className="text-xs font-bold">★</span>
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {sortedLayers.map((layer, index) => (
          <div
            key={layer.id}
            className={`flex items-center gap-2 p-2 border-2 transition-colors ${
              selectedLayerId === layer.id
                ? 'border-black bg-black text-white'
                : 'border-black bg-gray-50 hover:bg-yellow-50'
            }`}
            onClick={() => onSelectLayer(layer.id)}
          >
            {/* Visibility toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              className="p-0.5 hover:opacity-70"
            >
              {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            {/* Layer type indicator */}
            <span className="text-xs font-bold w-6 text-center uppercase">
              {layer.type === 'background' ? 'BG' : layer.type === 'image' ? 'IMG' : layer.type === 'text' ? 'T' : '★'}
            </span>

            {/* Layer name */}
            <span className="text-xs font-mono flex-1 truncate">
              {layer.type === 'text' ? (layer as TextLayer).content.slice(0, 20) : `${layer.type} #${index + 1}`}
            </span>

            {/* Move buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveLayerUp(layer.id);
                }}
                className="p-0.5 hover:opacity-70"
                disabled={index === sortedLayers.length - 1}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveLayerDown(layer.id);
                }}
                className="p-0.5 hover:opacity-70"
                disabled={index === 0}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLayer(layer.id);
              }}
              className="p-0.5 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
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
          <p className="text-sm font-mono uppercase tracking-wider text-gray-500">
            Select a layer to edit
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <h2 className="font-display text-sm uppercase tracking-wider">
            Inspector: {layer.type.toUpperCase()}
          </h2>
        </div>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold uppercase"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>

      {/* Position */}
      <section>
        <span className="text-xs font-mono uppercase tracking-wider text-gray-500 block mb-2">Position</span>
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
      </section>

      {/* Transform */}
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

      {/* Type-specific properties */}
      {layer.type === 'background' && (
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
          {layer.bgType === 'solid' && (
            <label className="block">
              <span className="text-[10px] font-mono uppercase text-gray-500">Color</span>
              <input
                type="color"
                value={layer.color || '#667eea'}
                onChange={(e) => onChange({ ...layer, color: e.target.value })}
                className="mt-1 w-full h-10 border-2 border-black cursor-pointer"
              />
            </label>
          )}
        </section>
      )}

      {layer.type === 'image' && (
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
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-bold uppercase">Device Frame</span>
              <p className="text-[10px] text-gray-500 mt-0.5">Add device bezel</p>
            </div>
            <input
              type="checkbox"
              checked={layer.showDeviceFrame || false}
              onChange={(e) => onChange({ ...layer, showDeviceFrame: e.target.checked })}
              className="w-4 h-4 border-2 border-black"
            />
          </label>
        </section>
      )}

      {layer.type === 'text' && (
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
              value={(layer as any).color || '#ffffff'}
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ScreenshotsPage() {
  // Project Level State
  const [appName, setAppName] = useState('Pulse Studio');
  const [description, setDescription] = useState('用更轻的流程管理训练计划、习惯追踪和每日反馈，让用户在第一屏就理解核心价值。');
  const [deviceType, setDeviceType] = useState<DeviceType>('iphone_67');
  const [uploads, setUploads] = useState<ScreenshotAsset[]>([]);
  const [logoAsset, setLogoAsset] = useState<ScreenshotAsset | null>(null);

  // LayerTree Config State
  const [config, setConfig] = useState<AiLayerTreeConfig>(MOCK_LAYER_TREE_CONFIG);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Undo/Redo History
  const [history, setHistory] = useState<AiLayerTreeConfig[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [exportRequest, setExportRequest] = useState(0);

  const currentSlide = config.slides[currentSlideIndex];
  const selectedLayer = currentSlide?.layers.find((l) => l.id === selectedLayerId) || null;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setConfig(history[historyIndex + 1]);
          }
        } else {
          // Undo
          if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setConfig(history[historyIndex - 1]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // Add to history
  const addToHistory = useCallback((newConfig: AiLayerTreeConfig) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newConfig);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Handlers
  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const nextAssets = await Promise.all(files.map(fileToAsset));
    setUploads((current) => [...current, ...nextAssets]);
  };

  const handleLogoFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const asset = await fileToAsset(file);
    setLogoAsset(asset);
  };

  const handleRemoveUpload = (id: string) => {
    setUploads((current) => current.filter((u) => u.id !== id));
  };

  const handleRemoveLogo = () => {
    setLogoAsset(null);
  };

  const handleSelectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setSelectedLayerId(null);
  };

  const updateLayer = useCallback((updatedLayer: Layer) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        slides: prev.slides.map((slide, i) =>
          i === currentSlideIndex
            ? {
                ...slide,
                layers: slide.layers.map((l) => (l.id === updatedLayer.id ? updatedLayer : l)),
              }
            : slide
        ),
      };
      addToHistory(newConfig);
      return newConfig;
    });
  }, [currentSlideIndex, addToHistory]);

  const deleteLayer = useCallback(() => {
    if (!selectedLayerId) return;
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        slides: prev.slides.map((slide, i) =>
          i === currentSlideIndex
            ? {
                ...slide,
                layers: slide.layers.filter((l) => l.id !== selectedLayerId),
              }
            : slide
        ),
      };
      addToHistory(newConfig);
      return newConfig;
    });
    setSelectedLayerId(null);
  }, [currentSlideIndex, selectedLayerId, addToHistory]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        slides: prev.slides.map((slide, i) =>
          i === currentSlideIndex
            ? {
                ...slide,
                layers: slide.layers.map((l) =>
                  l.id === layerId ? { ...l, visible: !l.visible } : l
                ),
              }
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
      if (index === -1 || index >= layers.length - 1) return prev;

      // Swap with next layer
      const temp = layers[index].zIndex;
      layers[index].zIndex = layers[index + 1].zIndex;
      layers[index + 1].zIndex = temp;

      return {
        ...prev,
        slides: prev.slides.map((s, i) =>
          i === currentSlideIndex ? { ...slide, layers } : s
        ),
      };
    });
  }, [currentSlideIndex, addToHistory]);

  const moveLayerDown = useCallback((layerId: string) => {
    setConfig((prev) => {
      const slide = prev.slides[currentSlideIndex];
      if (!slide) return prev;

      const layers = [...slide.layers];
      const index = layers.findIndex((l) => l.id === layerId);
      if (index === -1 || index === 0) return prev;

      // Swap with previous layer
      const temp = layers[index].zIndex;
      layers[index].zIndex = layers[index - 1].zIndex;
      layers[index - 1].zIndex = temp;

      return {
        ...prev,
        slides: prev.slides.map((s, i) =>
          i === currentSlideIndex ? { ...slide, layers } : s
        ),
      };
    });
  }, [currentSlideIndex, addToHistory]);

  const addLayer = useCallback((type: Layer["type"]) => {
    const newLayer = createDefaultLayer(type, 100);
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        slides: prev.slides.map((slide, i) =>
          i === currentSlideIndex
            ? {
                ...slide,
                layers: [...slide.layers, newLayer],
              }
            : slide
        ),
      };
      addToHistory(newConfig);
      return newConfig;
    });
    setSelectedLayerId(newLayer.id);
  }, [currentSlideIndex, addToHistory]);

  const handleGenerateDraft = () => {
    if (uploads.length === 0) {
      alert('Please upload at least one screenshot first.');
      return;
    }

    // Generate a simple LayerTree config from uploads
    const newSlides = uploads.map((upload, index) => ({
      slideId: generateId('slide'),
      name: `${appName} - Screen ${index + 1}`,
      layers: [
        {
          id: generateId('bg'),
          type: 'background' as const,
          visible: true,
          zIndex: 0,
          x: 0,
          y: 0,
          width: 1206,
          height: 2622,
          bgType: 'gradient' as const,
          gradient: {
            type: 'linear' as const,
            stops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' },
            ],
          },
        },
        {
          id: generateId('img'),
          type: 'image' as const,
          visible: true,
          zIndex: 1,
          x: 397,
          y: 370,
          width: 412,
          height: 878,
          assetRef: upload.id,
          fit: 'cover' as const,
          cornerRadius: 47,
          showDeviceFrame: true,
          frameRef: 'iphone-17-pro-silver',
        },
        {
          id: generateId('text'),
          type: 'text' as const,
          visible: true,
          zIndex: 2,
          x: 100,
          y: 2350,
          width: 1006,
          height: 120,
          content: `${appName} - Feature ${index + 1}`,
          fontFamily: 'SF Pro Display',
          fontSize: 48,
          fontWeight: '600' as const,
          color: '#ffffff',
          align: 'center' as const,
        },
      ] as Layer[],
    }));

    const newConfig: AiLayerTreeConfig = {
      version: '1.0',
      exportedPngSize: { w: 1206, h: 2622 },
      device: {
        frameRef: 'iphone-17-pro-silver',
      },
      slides: newSlides,
    };

    setConfig(newConfig);
    addToHistory(newConfig);
    setCurrentSlideIndex(0);
    setSelectedLayerId(null);
  };

  const handleExportReady = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${sanitizeFilename(appName)}-page-${currentSlideIndex + 1}.png`;
    link.click();
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Panel */}
      <ProjectPanel
        appName={appName}
        description={description}
        deviceType={deviceType}
        uploads={uploads}
        logoAsset={logoAsset}
        slides={config.slides.map((s) => ({ slideId: s.slideId, name: s.name }))}
        currentSlideIndex={currentSlideIndex}
        onAppNameChange={setAppName}
        onDescriptionChange={setDescription}
        onDeviceTypeChange={setDeviceType}
        onUploadFiles={handleUploadFiles}
        onLogoFile={handleLogoFile}
        onRemoveUpload={handleRemoveUpload}
        onRemoveLogo={handleRemoveLogo}
        onSelectSlide={handleSelectSlide}
        onGenerateDraft={handleGenerateDraft}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="h-16 border-b-2 border-black bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-black transition-colors ${
                historyIndex <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-yellow-50'
              }`}
            >
              <Undo2 className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Undo</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`flex items-center gap-2 px-3 py-2 border-2 border-black transition-colors ${
                historyIndex >= history.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-yellow-50'
              }`}
            >
              <Redo2 className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Redo</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const newConfig = { ...config };
                addToHistory(newConfig);
              }}
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
              if (selectedLayerId === layerId) setSelectedLayerId(null);
              setConfig((prev) => ({
                ...prev,
                slides: prev.slides.map((slide, i) =>
                  i === currentSlideIndex
                    ? { ...slide, layers: slide.layers.filter((l) => l.id !== layerId) }
                    : slide
                ),
              }));
              addToHistory({
                ...config,
                slides: config.slides.map((slide, i) =>
                  i === currentSlideIndex
                    ? { ...slide, layers: slide.layers.filter((l) => l.id !== layerId) }
                    : slide
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
          <PropertyPanel layer={selectedLayer} onChange={updateLayer} onDelete={deleteLayer} />
        </div>

        {/* Next Up Section */}
        <div className="border-t-2 border-black p-4 bg-black text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-display text-sm uppercase">Next Up</h3>
          </div>
          <ul className="text-xs space-y-1.5 opacity-80">
            <li>• AI-powered layer generation</li>
            <li>• Real-time preview updates</li>
            <li>• Multi-slide batch export</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
