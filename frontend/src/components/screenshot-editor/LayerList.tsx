"use client";

import React from "react";
import { Eye, EyeOff, Trash2, ArrowUp, ArrowDown, Plus, Image, Type, Star, Palette } from "lucide-react";
import { Layer } from "@/lib/layer-tree-types";

interface LayerListProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onAddLayer: (type: Layer["type"]) => void;
}

export default function LayerList({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisible,
  onDeleteLayer,
  onMoveUp,
  onMoveDown,
  onAddLayer,
}: LayerListProps) {
  const getLayerName = (layer: Layer) => {
    switch (layer.type) {
      case "background":
        return "背景";
      case "image":
        return "图片";
      case "text":
        return "文字";
      case "sticker":
        return "贴纸";
    }
  };

  const getLayerIcon = (type: Layer["type"]) => {
    switch (type) {
      case "background":
        return <Palette size={14} />;
      case "image":
        return <Image size={14} />;
      case "text":
        return <Type size={14} />;
      case "sticker":
        return <Star size={14} />;
    }
  };

  // 反向显示（顶层在上）
  const displayLayers = [...layers].reverse();

  return (
    <div className="h-1/2 flex flex-col border-b border-gray-700">
      <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-medium">图层</h3>
      </div>

      {/* 添加图层按钮 */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => onAddLayer("background")}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs hover:bg-gray-700 transition-colors"
          title="添加背景"
        >
          <Palette size={12} />
          背景
        </button>
        <button
          onClick={() => onAddLayer("image")}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs hover:bg-gray-700 transition-colors"
          title="添加图片"
        >
          <Image size={12} />
          图片
        </button>
        <button
          onClick={() => onAddLayer("text")}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs hover:bg-gray-700 transition-colors"
          title="添加文字"
        >
          <Type size={12} />
          文字
        </button>
        <button
          onClick={() => onAddLayer("sticker")}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs hover:bg-gray-700 transition-colors"
          title="添加贴纸"
        >
          <Star size={12} />
          贴纸
        </button>
      </div>

      {/* 图层列表 */}
      <div className="flex-1 overflow-y-auto">
        {displayLayers.map((layer, index) => {
          const originalIndex = layers.length - 1 - index;
          return (
            <div
              key={layer.id}
              className={`flex items-center gap-2 px-3 py-2 border-b border-gray-700 cursor-pointer transition-colors ${
                selectedLayerId === layer.id ? "bg-blue-900/50" : "hover:bg-gray-700"
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              {/* 图标 */}
              <span className="text-gray-400">{getLayerIcon(layer.type)}</span>

              {/* 名称 */}
              <span className="flex-1 text-sm truncate">{getLayerName(layer)}</span>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisible(layer.id);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                  title={layer.visible ? "隐藏" : "显示"}
                >
                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-gray-500" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(originalIndex);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                  title="上移"
                  disabled={originalIndex >= layers.length - 1}
                >
                  <ArrowUp size={12} className={originalIndex >= layers.length - 1 ? "text-gray-600" : ""} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown(originalIndex);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                  title="下移"
                  disabled={originalIndex <= 0}
                >
                  <ArrowDown size={12} className={originalIndex <= 0 ? "text-gray-600" : ""} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  className="p-1 hover:bg-red-600 rounded"
                  title="删除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {layers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <span className="text-sm">暂无图层</span>
            <span className="text-xs mt-1">点击上方按钮添加</span>
          </div>
        )}
      </div>
    </div>
  );
}
