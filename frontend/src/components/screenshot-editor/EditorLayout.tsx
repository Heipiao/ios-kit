"use client";

import React, { useState, useCallback } from "react";
import { AiLayerTreeConfig, Layer } from "@/lib/layer-tree-types";
import { MOCK_LAYER_TREE_CONFIG } from "@/lib/layer-tree-mock";
import CanvasPanel from "./CanvasPanel";
import LayerList from "./LayerList";
import PropertyPanel from "./PropertyPanel";
import Toolbar from "./Toolbar";
import SlideTabs from "./SlideTabs";

export default function ScreenshotEditor() {
  const [config, setConfig] = useState<AiLayerTreeConfig>(MOCK_LAYER_TREE_CONFIG);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const currentSlide = config.slides[currentSlideIndex];
  const selectedLayer = currentSlide?.layers.find((l) => l.id === selectedLayerId) || null;

  // 更新图层
  const updateLayer = useCallback((updatedLayer: Layer) => {
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, i) =>
        i === currentSlideIndex
          ? {
              ...slide,
              layers: slide.layers.map((l) => (l.id === updatedLayer.id ? updatedLayer : l)),
            }
          : slide
      ),
    }));
  }, [currentSlideIndex]);

  // 删除图层
  const deleteLayer = useCallback((layerId: string) => {
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, i) =>
        i === currentSlideIndex
          ? {
              ...slide,
              layers: slide.layers.filter((l) => l.id !== layerId),
            }
          : slide
      ),
    }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  }, [currentSlideIndex, selectedLayerId]);

  // 切换图层可见性
  const toggleLayerVisible = useCallback((layerId: string) => {
    setConfig((prev) => ({
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
    }));
  }, [currentSlideIndex]);

  // 上移图层
  const moveLayerUp = useCallback((index: number) => {
    if (index >= currentSlide.layers.length - 1) return;
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, i) => {
        if (i !== currentSlideIndex) return slide;
        const newLayers = [...slide.layers];
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
        // 更新 zIndex
        newLayers.forEach((layer, idx) => {
          layer.zIndex = idx;
        });
        return { ...slide, layers: newLayers };
      }),
    }));
  }, [currentSlideIndex, currentSlide]);

  // 下移图层
  const moveLayerDown = useCallback((index: number) => {
    if (index <= 0) return;
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, i) => {
        if (i !== currentSlideIndex) return slide;
        const newLayers = [...slide.layers];
        [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
        // 更新 zIndex
        newLayers.forEach((layer, idx) => {
          layer.zIndex = idx;
        });
        return { ...slide, layers: newLayers };
      }),
    }));
  }, [currentSlideIndex, currentSlide]);

  // 添加图层
  const addLayer = useCallback((type: Layer["type"]) => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      type,
      visible: true,
      x: type === "background" ? 0 : 100,
      y: type === "background" ? 0 : 100,
      width: type === "background" ? config.exportedPngSize.w : 400,
      height: type === "background" ? config.exportedPngSize.h : 200,
      rotation: 0,
      opacity: 1,
      zIndex: currentSlide.layers.length,
      ...(type === "background" && { bgType: "solid" as const, color: "#667eea" }),
      ...(type === "image" && { assetRef: "", fit: "cover" as const }),
      ...(type === "text" && {
        content: "新文本",
        fontFamily: "SF Pro Display",
        fontSize: 32,
        fontWeight: "normal" as const,
        color: "#000000",
        align: "center" as const,
      }),
      ...(type === "sticker" && { stickerId: "5g-badge" }),
    } as Layer;

    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, i) =>
        i === currentSlideIndex
          ? { ...slide, layers: [...slide.layers, newLayer] }
          : slide
      ),
    }));
    setSelectedLayerId(newLayer.id);
  }, [currentSlideIndex, currentSlide, config.exportedPngSize]);

  // 导出 PNG（Mock）
  const handleExport = useCallback(() => {
    alert("导出功能开发中... 将导出 " + config.exportedPngSize.w + "x" + config.exportedPngSize.h);
  }, [config.exportedPngSize]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* 顶部工具栏 */}
      <Toolbar onExport={handleExport} onAddLayer={addLayer} />

      {/* 主体内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧画布 */}
        <div className="flex-1 flex flex-col bg-gray-800 overflow-hidden">
          <CanvasPanel
            config={config}
            slide={currentSlide}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={updateLayer}
          />
          {/* 底部 Slide 页签 */}
          <SlideTabs
            slides={config.slides}
            currentIndex={currentSlideIndex}
            onChangeIndex={setCurrentSlideIndex}
          />
        </div>

        {/* 右侧面板 */}
        <div className="w-80 flex flex-col border-l border-gray-700 bg-gray-850">
          {/* 图层列表 */}
          <LayerList
            layers={currentSlide?.layers || []}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onToggleVisible={toggleLayerVisible}
            onDeleteLayer={deleteLayer}
            onMoveUp={moveLayerUp}
            onMoveDown={moveLayerDown}
            onAddLayer={addLayer}
          />
          {/* 属性面板 */}
          <PropertyPanel
            layer={selectedLayer}
            onChange={updateLayer}
          />
        </div>
      </div>
    </div>
  );
}
