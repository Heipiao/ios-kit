"use client";

import { type ReactNode, useMemo, useRef } from "react";
import { Palette, Trash2, Upload } from "lucide-react";
import {
  DEFAULT_DEVICE_FRAME_ASSET_ID,
  DEVICE_FRAME_MODEL_OPTIONS,
  findDeviceFrameAssetId,
  getDeviceFrameAsset,
  getDeviceFrameColorOptions,
} from "@/lib/device-frame-assets";
import type { ScreenshotAsset } from "@/lib/screenshot-editor";
import type { BackgroundLayer, DeviceLayer, ImageLayer, Layer, TextLayer } from "@/lib/layer-tree-types";

interface InspectorPanelProps {
  isUploadingImage: boolean;
  layer: Layer | null;
  onChange: (layer: Layer) => void;
  onDelete: () => void;
  onUploadAsset: (layerId: string, file: File) => Promise<void>;
  uploads: ScreenshotAsset[];
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section>
      <span className="mb-2 block text-xs font-mono uppercase tracking-wider text-gray-500">{title}</span>
      {children}
    </section>
  );
}

export default function InspectorPanel({
  isUploadingImage,
  layer,
  onChange,
  onDelete,
  onUploadAsset,
  uploads,
}: InspectorPanelProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const resizeDeviceLayerToFrame = (currentLayer: DeviceLayer, frameAssetId: string) => {
    const frameAsset = getDeviceFrameAsset(frameAssetId);
    if (!frameAsset) {
      return currentLayer;
    }

    const aspectRatio = frameAsset.outerSize.w / frameAsset.outerSize.h;
    const centerX = currentLayer.x + currentLayer.width / 2;
    const centerY = currentLayer.y + currentLayer.height / 2;
    const widthFromHeight = currentLayer.height * aspectRatio;
    const heightFromWidth = currentLayer.width / aspectRatio;
    const nextWidth = widthFromHeight <= currentLayer.width ? widthFromHeight : currentLayer.width;
    const nextHeight = widthFromHeight <= currentLayer.width ? currentLayer.height : heightFromWidth;

    return {
      ...currentLayer,
      frameAssetId,
      width: Math.max(10, Math.round(nextWidth)),
      height: Math.max(10, Math.round(nextHeight)),
      x: Math.round(centerX - nextWidth / 2),
      y: Math.round(centerY - nextHeight / 2),
    };
  };

  const currentAssetLabel = useMemo(() => {
    if (!layer || (layer.type !== "image" && layer.type !== "device") || !layer.assetRef) {
      return null;
    }

    return uploads.find((upload) => upload.id === layer.assetRef)?.name || layer.assetRef;
  }, [layer, uploads]);

  const selectedDeviceFrameAsset = useMemo(() => {
    if (!layer || layer.type !== "device") {
      return null;
    }

    return getDeviceFrameAsset(layer.frameAssetId || DEFAULT_DEVICE_FRAME_ASSET_ID) || null;
  }, [layer]);

  const selectedDeviceModelId = selectedDeviceFrameAsset?.modelId || DEVICE_FRAME_MODEL_OPTIONS[0]?.id || "";
  const selectedDeviceColorOptions = useMemo(() => {
    if (!selectedDeviceModelId) {
      return [];
    }
    return getDeviceFrameColorOptions(selectedDeviceModelId);
  }, [selectedDeviceModelId]);

  if (!layer) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        <div className="py-8 text-center">
          <Palette className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p className="text-sm font-mono uppercase tracking-wider text-gray-500">Select a layer to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b-2 border-black px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <h2 className="font-display text-sm uppercase tracking-wider">Inspector: {layer.type.toUpperCase()}</h2>
        </div>

        {layer.type !== "background" ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 border-2 border-red-600 px-2 py-1 text-xs font-bold uppercase text-red-600 transition-colors hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {layer.type === "background" ? (
          <Section title="Background">
            <label className="block">
              <span className="text-[10px] font-mono uppercase text-gray-500">Type</span>
              <select
                value={layer.bgType}
                onChange={(event) => {
                  const nextType = event.target.value as BackgroundLayer["bgType"];
                  if (nextType === "solid") {
                    onChange({ ...layer, bgType: nextType, color: layer.color || "#667eea" });
                    return;
                  }

                  if (nextType === "gradient") {
                    onChange({
                      ...layer,
                      bgType: nextType,
                      gradient: layer.gradient || {
                        type: "linear",
                        stops: [
                          { offset: 0, color: "#667eea" },
                          { offset: 1, color: "#764ba2" },
                        ],
                      },
                    });
                    return;
                  }

                  onChange({ ...layer, bgType: nextType });
                }}
                className="mt-1 w-full border-2 border-black bg-white px-2 py-1.5 text-sm"
              >
                <option value="solid">Solid</option>
                <option value="gradient">Gradient</option>
                <option value="image">Image</option>
              </select>
            </label>

            {layer.bgType === "solid" ? (
              <label className="mt-2 block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Color</span>
                <input
                  type="color"
                  value={layer.color || "#667eea"}
                  onChange={(event) => onChange({ ...layer, color: event.target.value })}
                  className="mt-1 h-10 w-full cursor-pointer border-2 border-black"
                />
              </label>
            ) : null}

            {layer.bgType === "gradient" ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Start</span>
                  <input
                    type="color"
                    value={layer.gradient?.stops[0]?.color || "#667eea"}
                    onChange={(event) =>
                      onChange({
                        ...layer,
                        gradient: {
                          type: layer.gradient?.type || "linear",
                          angle: layer.gradient?.angle,
                          stops: [
                            { offset: 0, color: event.target.value },
                            { offset: 1, color: layer.gradient?.stops[1]?.color || "#764ba2" },
                          ],
                        },
                      })
                    }
                    className="mt-1 h-10 w-full cursor-pointer border-2 border-black"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-mono uppercase text-gray-500">End</span>
                  <input
                    type="color"
                    value={layer.gradient?.stops[1]?.color || "#764ba2"}
                    onChange={(event) =>
                      onChange({
                        ...layer,
                        gradient: {
                          type: layer.gradient?.type || "linear",
                          angle: layer.gradient?.angle,
                          stops: [
                            { offset: 0, color: layer.gradient?.stops[0]?.color || "#667eea" },
                            { offset: 1, color: event.target.value },
                          ],
                        },
                      })
                    }
                    className="mt-1 h-10 w-full cursor-pointer border-2 border-black"
                  />
                </label>
              </div>
            ) : null}

            {layer.bgType === "image" ? (
              <p className="mt-2 text-xs font-mono text-gray-500">Background image JSON can be inspected in Debug mode.</p>
            ) : null}
          </Section>
        ) : (
          <Section title="Frame">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">X</span>
                <input
                  type="number"
                  value={layer.x}
                  onChange={(event) => onChange({ ...layer, x: Number(event.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Y</span>
                <input
                  type="number"
                  value={layer.y}
                  onChange={(event) => onChange({ ...layer, y: Number(event.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Width</span>
                <input
                  type="number"
                  value={layer.width}
                  onChange={(event) => onChange({ ...layer, width: Number(event.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Height</span>
                <input
                  type="number"
                  value={layer.height}
                  onChange={(event) => onChange({ ...layer, height: Number(event.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          </Section>
        )}

        {layer.type === "image" ? (
          <Section title="Image">
            <p className="mb-2 text-[10px] font-mono uppercase text-gray-500">
              {currentAssetLabel ? `Linked: ${currentAssetLabel}` : "No asset linked"}
            </p>

            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploadingImage}
              className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              <Upload className="h-4 w-4" />
              {isUploadingImage ? "Uploading" : "Upload Image"}
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                await onUploadAsset(layer.id, file);
                event.target.value = "";
              }}
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Fit</span>
                <select
                  value={layer.fit}
                  onChange={(event) => onChange({ ...layer, fit: event.target.value as ImageLayer["fit"] })}
                  className="mt-1 w-full border-2 border-black bg-white px-2 py-1.5 text-sm"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Radius</span>
                <input
                  type="number"
                  value={layer.cornerRadius || 0}
                  onChange={(event) => onChange({ ...layer, cornerRadius: Number(event.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          </Section>
        ) : null}

        {layer.type === "device" ? (
          <Section title="Device">
            <p className="mb-2 text-[10px] font-mono uppercase text-gray-500">
              {currentAssetLabel ? `Screenshot: ${currentAssetLabel}` : "No screenshot linked"}
            </p>

            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploadingImage}
              className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              <Upload className="h-4 w-4" />
              {isUploadingImage ? "Uploading" : "Upload Shot"}
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                await onUploadAsset(layer.id, file);
                event.target.value = "";
              }}
            />

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Mode</span>
                <select
                  value={(layer as DeviceLayer).renderMode}
                  onChange={(event) => {
                    const nextMode = event.target.value as DeviceLayer["renderMode"];
                    const nextLayer: DeviceLayer = {
                      ...layer,
                      renderMode: nextMode,
                      frameAssetId: nextMode === "frame-asset"
                        ? (layer as DeviceLayer).frameAssetId || DEFAULT_DEVICE_FRAME_ASSET_ID
                        : undefined,
                    };

                    onChange(
                      nextMode === "frame-asset" && nextLayer.frameAssetId
                        ? resizeDeviceLayerToFrame(nextLayer, nextLayer.frameAssetId)
                        : nextLayer
                    );
                  }}
                  className="mt-1 w-full border-2 border-black bg-white px-2 py-1.5 text-sm"
                >
                  <option value="screenshot-only">Screenshot Only</option>
                  <option value="frame-asset">Frame Asset</option>
                </select>
              </label>
              {(layer as DeviceLayer).renderMode === "screenshot-only" ? (
                <label className="block">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Border</span>
                  <input
                    type="color"
                    value={(layer as DeviceLayer).borderColor || "#111111"}
                    onChange={(event) => onChange({ ...layer, borderColor: event.target.value })}
                    className="mt-1 h-10 w-full cursor-pointer border-2 border-black"
                  />
                </label>
              ) : null}
            </div>

            {(layer as DeviceLayer).renderMode === "frame-asset" ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Model</span>
                  <select
                    value={selectedDeviceModelId}
                    onChange={(event) => {
                      const nextModelId = event.target.value;
                      const nextColor = getDeviceFrameColorOptions(nextModelId)[0];
                      if (!nextColor) {
                        return;
                      }
                      onChange(resizeDeviceLayerToFrame(layer as DeviceLayer, nextColor.frameAssetId));
                    }}
                    className="mt-1 w-full border-2 border-black bg-white px-2 py-1.5 text-sm"
                  >
                    {DEVICE_FRAME_MODEL_OPTIONS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Color</span>
                  <select
                    value={selectedDeviceFrameAsset?.colorId || selectedDeviceColorOptions[0]?.id || ""}
                    onChange={(event) => {
                      const nextFrameAssetId = findDeviceFrameAssetId(selectedDeviceModelId, event.target.value);
                      if (!nextFrameAssetId) {
                        return;
                      }
                      onChange(resizeDeviceLayerToFrame(layer as DeviceLayer, nextFrameAssetId));
                    }}
                    className="mt-1 w-full border-2 border-black bg-white px-2 py-1.5 text-sm"
                  >
                    {selectedDeviceColorOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Border Width</span>
                  <input
                    type="number"
                    value={(layer as DeviceLayer).borderWidth || 12}
                    onChange={(event) => onChange({ ...layer, borderWidth: Number(event.target.value) })}
                    className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-mono uppercase text-gray-500">Radius</span>
                  <input
                    type="number"
                    value={(layer as DeviceLayer).cornerRadius || 0}
                    onChange={(event) => onChange({ ...layer, cornerRadius: Number(event.target.value) })}
                    className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
            )}
          </Section>
        ) : null}

        {layer.type === "text" ? (
          <Section title="Text">
            <label className="block">
              <span className="text-[10px] font-mono uppercase text-gray-500">Content</span>
              <textarea
                value={(layer as TextLayer).content}
                onChange={(event) => onChange({ ...layer, content: event.target.value })}
                rows={3}
                className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
              />
            </label>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Color</span>
                <input
                  type="color"
                  value={(layer as TextLayer).color || "#ffffff"}
                  onChange={(event) => onChange({ ...layer, color: event.target.value })}
                  className="mt-1 h-10 w-full cursor-pointer border-2 border-black"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase text-gray-500">Size</span>
                <input
                  type="number"
                  value={(layer as TextLayer).fontSize || 32}
                  onChange={(event) => onChange({ ...layer, fontSize: Number(event.target.value) })}
                  className="mt-1 w-full border-2 border-black px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <label className="mt-2 block">
              <span className="text-[10px] font-mono uppercase text-gray-500">Align</span>
              <select
                value={(layer as TextLayer).align}
                onChange={(event) => onChange({ ...layer, align: event.target.value as TextLayer["align"] })}
                className="mt-1 w-full border-2 border-black bg-white px-2 py-1.5 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
