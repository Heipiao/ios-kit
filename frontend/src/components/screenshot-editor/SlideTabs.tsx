"use client";

import React from "react";
import { SlideConfig } from "@/lib/layer-tree-types";
import { Plus, X } from "lucide-react";

interface SlideTabsProps {
  slides: SlideConfig[];
  currentIndex: number;
  onChangeIndex: (index: number) => void;
}

export default function SlideTabs({ slides, currentIndex, onChangeIndex }: SlideTabsProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-gray-800 border-t border-gray-700 overflow-x-auto">
      {slides.map((slide, index) => (
        <div
          key={slide.slideId}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
            index === currentIndex
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
          onClick={() => onChangeIndex(index)}
        >
          <span className="text-sm">{slide.name || `第${index + 1}页`}</span>
          {slides.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // 删除逻辑待实现
              }}
              className="p-0.5 hover:bg-white/20 rounded"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => {}}
        className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors whitespace-nowrap"
      >
        <Plus size={14} />
        添加页
      </button>
    </div>
  );
}
