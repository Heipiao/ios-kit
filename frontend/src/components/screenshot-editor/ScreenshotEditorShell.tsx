"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  Download,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import KonvaStage from "@/components/konva/KonvaStage";
import type { DeviceType, LayerAssetDebugInfo, ScreenshotAsset } from "@/lib/screenshot-editor";
import { DEVICE_PRESETS } from "@/lib/screenshot-editor";
import type { AiLayerTreeConfig, Layer } from "@/lib/layer-tree-types";
import DebugJsonPanel from "./DebugJsonPanel";
import InspectorPanel from "./InspectorPanel";
import LayerListPanel from "./LayerListPanel";

interface ScreenshotEditorShellProps {
  config: AiLayerTreeConfig;
  currentDeviceLayer: Layer | null;
  currentSlideIndex: number;
  errorMessage: string | null;
  exportRequest: number;
  historyIndex: number;
  historyLength: number;
  inspectorLayer: Layer | null;
  isUploadingImage: boolean;
  lastSavedAt: string | null;
  debugAssets: LayerAssetDebugInfo[];
  onAddLayer: (type: "device" | "image" | "text") => void;
  onCreateSlide: () => void;
  onDeleteLayer: (layerId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onDeviceTypeChange: (deviceType: DeviceType) => void;
  onExportReady: (dataUrl: string) => void;
  onMoveLayerDown: (layerId: string) => void;
  onMoveLayerUp: (layerId: string) => void;
  onRequestExport: () => void;
  onSave: () => void;
  onDebugAssetsChange: (assets: LayerAssetDebugInfo[]) => void;
  onSelectLayer: (layerId: string | null) => void;
  onSelectSlide: (slideIndex: number) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateLayer: (layer: Layer) => void;
  onUploadCurrentSlideImage: (file: File) => Promise<void>;
  onUploadLayerAsset: (layerId: string, file: File) => Promise<void>;
  projectId: string;
  projectName: string;
  exportLabel: string;
  planCode: "free" | "base" | "pro";
  saveState: "idle" | "saving" | "saved" | "error";
  selectedDeviceType: DeviceType;
  selectedLayerId: string | null;
  selectedSlideLayers: Layer[];
  slideName: string;
  slides: AiLayerTreeConfig["slides"];
  uploads: ScreenshotAsset[];
}

export default function ScreenshotEditorShell({
  config,
  currentDeviceLayer,
  currentSlideIndex,
  errorMessage,
  exportRequest,
  historyIndex,
  historyLength,
  inspectorLayer,
  isUploadingImage,
  lastSavedAt,
  debugAssets,
  onAddLayer,
  onCreateSlide,
  onDeleteLayer,
  onDeleteSlide,
  onDeviceTypeChange,
  onExportReady,
  onMoveLayerDown,
  onMoveLayerUp,
  onRequestExport,
  onRedo,
  onSave,
  onDebugAssetsChange,
  onSelectLayer,
  onSelectSlide,
  onToggleLayerVisibility,
  onUndo,
  onUpdateLayer,
  onUploadCurrentSlideImage,
  onUploadLayerAsset,
  projectId,
  projectName,
  exportLabel,
  planCode,
  saveState,
  selectedDeviceType,
  selectedLayerId,
  selectedSlideLayers,
  slideName,
  slides,
  uploads,
}: ScreenshotEditorShellProps) {
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [showDebugJson, setShowDebugJson] = useState(false);
  const canDebug = process.env.NODE_ENV !== "production";

  const slidePreviewLookup = useMemo(() => {
    return Object.fromEntries(uploads.map((upload) => [upload.id, upload.previewUrl]));
  }, [uploads]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#ece9df]">
      <aside className="flex h-full w-72 flex-col overflow-hidden border-r-2 border-black bg-white">
        <div className="border-b-2 border-black bg-yellow-400 p-4">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-1 text-xs font-mono uppercase hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to project
          </Link>

          <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-700">Storyboard</p>
          <h1 className="mt-1 font-display text-2xl uppercase leading-none">{projectName}</h1>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono uppercase">
            <div className="border-2 border-black bg-white px-2 py-2">
              <p className="text-gray-500">Screens</p>
              <p className="mt-1 text-sm font-bold text-black">{slides.length}</p>
            </div>
            <div className="border-2 border-black bg-white px-2 py-2">
              <p className="text-gray-500">Device</p>
              <p className="mt-1 text-sm font-bold text-black">{DEVICE_PRESETS[selectedDeviceType].label}</p>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-700">Canvas Size</span>
            <select
              value={selectedDeviceType}
              onChange={(event) => onDeviceTypeChange(event.target.value as DeviceType)}
              className="mt-1 w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold"
            >
              {Object.entries(DEVICE_PRESETS).map(([value, preset]) => (
                <option key={value} value={value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCreateSlide}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase transition-colors hover:bg-yellow-50"
            >
              <Plus className="h-4 w-4" />
              New Page
            </button>

            <button
              type="button"
              onClick={() => screenshotInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-black px-3 py-2 text-xs font-bold uppercase text-white transition-colors hover:bg-red-500"
            >
              <Upload className="h-4 w-4" />
              {isUploadingImage ? "Uploading" : "Upload Shot"}
            </button>

            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                await onUploadCurrentSlideImage(file);
                event.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {slides.map((slide, index) => {
            const isActive = currentSlideIndex === index;
            const deviceLayer = slide.layers.find((layer): layer is Extract<Layer, { type: "device" }> => {
              return layer.type === "device" && Boolean(layer.assetRef);
            });
            const imageLayer = slide.layers.find((layer): layer is Extract<Layer, { type: "image" }> => {
              return layer.type === "image" && Boolean(layer.assetRef);
            });
            const previewAssetId = deviceLayer?.assetRef || imageLayer?.assetRef;
            const previewUrl = previewAssetId ? slidePreviewLookup[previewAssetId] : null;

            return (
              <div
                key={slide.slideId}
                className={`border-2 transition-all ${
                  isActive ? "border-black bg-black text-white shadow-[4px_4px_0px_#111111]" : "border-black bg-white"
                }`}
              >
                <div className="flex items-start justify-end px-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onDeleteSlide(slide.slideId)}
                    disabled={slides.length <= 1}
                    className={`inline-flex items-center justify-center border-2 px-2 py-1 transition-colors ${
                      slides.length <= 1
                        ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400"
                        : isActive
                          ? "border-white/70 bg-transparent text-white hover:bg-white hover:text-black"
                          : "border-black bg-white text-black hover:bg-red-500 hover:text-white"
                    }`}
                    aria-label={`Delete ${slide.name || `Screen ${index + 1}`}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectSlide(index);
                    onSelectLayer(null);
                  }}
                  className={`block w-full px-3 pb-3 text-left transition-colors ${
                    isActive ? "text-white" : "hover:bg-yellow-50"
                  }`}
                >
                  <div className="grid grid-cols-[78px_1fr] gap-3">
                    <div className="overflow-hidden border-2 border-black bg-[#ece9df]">
                      <div className="aspect-[9/16]">
                        {previewUrl ? (
                          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white px-2 text-center text-[10px] font-mono uppercase text-gray-500">
                            Empty page
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isActive ? "text-white/70" : "text-gray-500"}`}>
                        Screen {index + 1}
                      </p>
                      <p className="mt-1 line-clamp-2 font-display text-lg uppercase leading-tight">{slide.name || `Screen ${index + 1}`}</p>
                      <p className={`mt-2 text-[10px] font-mono uppercase ${isActive ? "text-white/70" : "text-gray-500"}`}>
                        {slide.layers.length} layers
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b-2 border-black bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Screenshot Editor</p>
              <h2 className="mt-1 font-display text-3xl uppercase leading-none">{slideName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase">
                <span className="border-2 border-black bg-white px-2 py-1 text-black">plan {planCode}</span>
                <span className="border-2 border-black bg-yellow-200 px-2 py-1 text-black">
                  {DEVICE_PRESETS[selectedDeviceType].label}
                </span>
                <span className="border-2 border-black bg-white px-2 py-1 text-black">{selectedSlideLayers.length} layers</span>
                {saveState === "saving" ? (
                  <span className="border-2 border-black bg-white px-2 py-1 text-black">Saving...</span>
                ) : null}
                {saveState === "saved" && lastSavedAt ? (
                  <span className="border-2 border-black bg-teal px-2 py-1 text-black">Saved {lastSavedAt}</span>
                ) : null}
                {saveState === "error" ? (
                  <span className="border-2 border-black bg-red px-2 py-1 text-white">Save failed</span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canDebug ? (
                <button
                  type="button"
                  onClick={() => setShowDebugJson((current) => !current)}
                  className={`inline-flex items-center gap-2 border-2 border-black px-3 py-2 text-sm font-bold uppercase transition-colors ${
                    showDebugJson ? "bg-yellow-300 text-black" : "bg-white hover:bg-yellow-50"
                  }`}
                >
                  <Bug className="h-4 w-4" />
                  Debug JSON
                </button>
              ) : null}

              <button
                type="button"
                onClick={onUndo}
                disabled={historyIndex <= 0}
                className={`inline-flex items-center gap-2 border-2 border-black px-3 py-2 text-sm font-bold uppercase transition-colors ${
                  historyIndex <= 0 ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-white hover:bg-yellow-50"
                }`}
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>

              <button
                type="button"
                onClick={onRedo}
                disabled={historyIndex >= historyLength - 1}
                className={`inline-flex items-center gap-2 border-2 border-black px-3 py-2 text-sm font-bold uppercase transition-colors ${
                  historyIndex >= historyLength - 1 ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-white hover:bg-yellow-50"
                }`}
              >
                <Redo2 className="h-4 w-4" />
                Redo
              </button>

              <button
                type="button"
                onClick={onSave}
                className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase transition-colors hover:bg-yellow-50"
              >
                <Save className="h-4 w-4" />
                Save
              </button>

              <button
                type="button"
                onClick={onRequestExport}
                className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 text-sm font-bold uppercase text-white transition-colors hover:bg-red-500"
              >
                <Download className="h-4 w-4" />
                {exportLabel}
              </button>
            </div>
          </div>
          {errorMessage ? (
            <div className="border-t-2 border-black bg-red-50 px-6 py-3 text-sm font-mono text-red-600">{errorMessage}</div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <KonvaStage
            config={config}
            debugMode={false}
            exportRequest={exportRequest}
            onDebugAssetsChange={onDebugAssetsChange}
            onExportReady={onExportReady}
            onSelectLayer={(layerId) => onSelectLayer(layerId)}
            onUpdateLayer={onUpdateLayer}
            selectedLayerId={selectedLayerId}
            slideIndex={currentSlideIndex}
            uploads={uploads}
          />
        </div>
      </main>

      <aside className="flex h-full w-[26rem] flex-col overflow-hidden border-l-2 border-black bg-[#f7f3e8]">
        <div className="border-b-2 border-black bg-white p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Current Page</p>
          <h3 className="mt-1 font-display text-2xl uppercase leading-none">{slideName}</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase">
            <span className="border-2 border-black bg-white px-2 py-1 text-black">{selectedSlideLayers.length} layers</span>
            {currentDeviceLayer && "width" in currentDeviceLayer ? (
              <span className="border-2 border-black bg-white px-2 py-1 text-black">
                device {Math.round(currentDeviceLayer.width)} x {Math.round(currentDeviceLayer.height)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="border-b-2 border-black bg-[#f7f3e8]">
          <LayerListPanel
            layers={selectedSlideLayers}
            onAddLayer={onAddLayer}
            onDeleteLayer={onDeleteLayer}
            onMoveLayerDown={onMoveLayerDown}
            onMoveLayerUp={onMoveLayerUp}
            onSelectLayer={(layerId) => onSelectLayer(layerId)}
            onToggleVisibility={onToggleLayerVisibility}
            selectedLayerId={selectedLayerId}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <InspectorPanel
            isUploadingImage={isUploadingImage}
            layer={inspectorLayer}
            onChange={onUpdateLayer}
            onDelete={() => {
              if (selectedLayerId) {
                onDeleteLayer(selectedLayerId);
              }
            }}
            onUploadAsset={onUploadLayerAsset}
            uploads={uploads}
          />
        </div>
      </aside>

      {showDebugJson && canDebug ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 p-6"
          onClick={() => setShowDebugJson(false)}
        >
          <div
            className="flex h-full w-full max-w-[1100px] flex-col overflow-hidden border-2 border-black bg-[#f7f3e8] shadow-[8px_8px_0px_#111111]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-black bg-white px-4 py-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Debug Mode</p>
                <h3 className="mt-1 font-display text-2xl uppercase leading-none">Asset Diagnostics</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowDebugJson(false)}
                className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-sm font-bold uppercase transition-colors hover:bg-yellow-50"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <DebugJsonPanel config={config} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
