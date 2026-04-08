"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Layers3, Plus, Trash2 } from "lucide-react";
import type { Layer, TextLayer } from "@/lib/layer-tree-types";

type AddableLayerType = Extract<Layer["type"], "device" | "image" | "text">;

interface LayerListPanelProps {
  layers: Layer[];
  onAddLayer: (type: AddableLayerType) => void;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayerDown: (layerId: string) => void;
  onMoveLayerUp: (layerId: string) => void;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  selectedLayerId: string | null;
}

function getLayerShortLabel(type: Layer["type"]) {
  if (type === "background") return "BG";
  if (type === "device") return "DV";
  if (type === "image") return "IMG";
  if (type === "text") return "TXT";
  return "ST";
}

export default function LayerListPanel({
  layers,
  onAddLayer,
  onDeleteLayer,
  onMoveLayerDown,
  onMoveLayerUp,
  onSelectLayer,
  onToggleVisibility,
  selectedLayerId,
}: LayerListPanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const sortedLayers = [...layers].sort((left, right) => left.zIndex - right.zIndex);

  return (
    <div className="border-t-2 border-black bg-white p-4">
      <div className="relative mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4" />
          <h2 className="font-display text-sm uppercase tracking-wider">Layers</h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAddMenu((current) => !current)}
          className="inline-flex h-8 w-8 items-center justify-center border-2 border-black bg-yellow-300 text-black transition-colors hover:bg-yellow-200"
          title="Add layer"
        >
          <Plus className="h-4 w-4" />
        </button>

        {showAddMenu ? (
          <div className="absolute right-0 top-10 z-10 w-36 border-2 border-black bg-white p-1 shadow-[4px_4px_0px_#111111]">
            {(["image", "text", "device"] as AddableLayerType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAddLayer(type);
                  setShowAddMenu(false);
                }}
                className="block w-full px-3 py-2 text-left text-xs font-bold uppercase transition-colors hover:bg-yellow-50"
              >
                Add {type}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto">
        {sortedLayers.map((layer, index) => {
          const isBackground = layer.type === "background";

          return (
            <div
              key={layer.id}
              className={`flex items-center gap-2 border-2 p-2 transition-colors ${
                selectedLayerId === layer.id ? "border-black bg-black text-white" : "border-black bg-gray-50 hover:bg-yellow-50"
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className="p-0.5 hover:opacity-70"
                title={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <span className="w-8 text-center text-[10px] font-bold uppercase">{getLayerShortLabel(layer.type)}</span>

              <span className="min-w-0 flex-1 truncate text-xs font-mono">
                {layer.type === "text"
                  ? (layer as TextLayer).content.slice(0, 24) || "Text"
                  : layer.type === "device"
                    ? "Device frame"
                    : `${layer.type} #${index + 1}`}
              </span>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveLayerUp(layer.id);
                  }}
                  className="p-0.5 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={isBackground || index === sortedLayers.length - 1}
                  title="Move up"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveLayerDown(layer.id);
                  }}
                  className="p-0.5 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={isBackground || index === 0}
                  title="Move down"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteLayer(layer.id);
                }}
                className="p-0.5 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                disabled={isBackground}
                title="Delete layer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {sortedLayers.length === 0 ? (
        <p className="py-4 text-center text-xs font-mono text-gray-400">No layers yet. Click + to add one.</p>
      ) : null}
    </div>
  );
}
