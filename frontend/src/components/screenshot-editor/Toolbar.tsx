"use client";

import React from "react";
import { Download, Image, Type, Square, Star } from "lucide-react";
import { Layer } from "@/lib/layer-tree-types";

interface ToolbarProps {
  onExport: () => void;
  onAddLayer: (type: Layer["type"]) => void;
}

export default function Toolbar({ onExport, onAddLayer }: ToolbarProps) {
  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-gray-700 bg-gray-800">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">截图编辑器</h1>

        {/* 添加图层按钮 */}
        <div className="flex items-center gap-2 ml-8">
          <span className="text-sm text-gray-400">添加图层:</span>
          <button
            onClick={() => onAddLayer("background")}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <Square size={14} />
            背景
          </button>
          <button
            onClick={() => onAddLayer("image")}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <Image size={14} />
            图片
          </button>
          <button
            onClick={() => onAddLayer("text")}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <Type size={14} />
            文字
          </button>
          <button
            onClick={() => onAddLayer("sticker")}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <Star size={14} />
            贴纸
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-400">
          尺寸：1206 × 2622
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <Download size={16} />
          导出 PNG
        </button>
      </div>
    </div>
  );
}
