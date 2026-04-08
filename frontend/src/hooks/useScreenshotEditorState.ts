"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDefaultLayer } from "@/lib/layer-tree-mock";
import { createSlideForDevice, type DeviceType } from "@/lib/screenshot-editor";
import type { AiLayerTreeConfig, DeviceLayer, ImageLayer, Layer, TextLayer } from "@/lib/layer-tree-types";

type AddableLayerType = Extract<Layer["type"], "device" | "image" | "text">;

interface UseScreenshotEditorStateOptions {
  initialConfig: AiLayerTreeConfig;
  projectName: string;
  selectedDeviceType: DeviceType;
  onDirtyChange?: () => void;
}

export function useScreenshotEditorState({
  initialConfig,
  projectName,
  selectedDeviceType,
  onDirtyChange,
}: UseScreenshotEditorStateOptions) {
  const [config, setConfig] = useState<AiLayerTreeConfig>(initialConfig);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<AiLayerTreeConfig[]>([initialConfig]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [exportRequest, setExportRequest] = useState(0);

  const historyIndexRef = useRef(0);

  useEffect(() => {
    setConfig(initialConfig);
    setCurrentSlideIndex(0);
    setSelectedLayerId(null);
    setHistory([initialConfig]);
    setHistoryIndex(0);
    historyIndexRef.current = 0;
  }, [initialConfig]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  const currentSlide = config.slides[currentSlideIndex];
  const selectedLayer = currentSlide?.layers.find((layer) => layer.id === selectedLayerId) || null;
  const backgroundLayer = currentSlide?.layers.find((layer) => layer.type === "background") || null;
  const primaryTextLayer = (currentSlide?.layers.find((layer) => layer.type === "text") as TextLayer | undefined) || null;
  const primaryImageLayer = (currentSlide?.layers.find((layer) => layer.type === "image") as ImageLayer | undefined) || null;
  const currentDeviceLayer = (currentSlide?.layers.find((layer) => layer.type === "device") as DeviceLayer | undefined) || null;

  const inspectorLayer = selectedLayer || backgroundLayer || primaryTextLayer || primaryImageLayer || currentDeviceLayer || null;

  const commitConfig = useCallback((nextConfig: AiLayerTreeConfig) => {
    onDirtyChange?.();
    setConfig(nextConfig);
    setHistory((previous) => {
      const trimmed = previous.slice(0, historyIndexRef.current + 1);
      const nextHistory = [...trimmed, nextConfig].slice(-50);
      const nextIndex = nextHistory.length - 1;
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
      return nextHistory;
    });
  }, [onDirtyChange]);

  const updateLayer = useCallback((updatedLayer: Layer) => {
    commitConfig({
      ...config,
      slides: config.slides.map((slide, index) =>
        index === currentSlideIndex
          ? { ...slide, layers: slide.layers.map((layer) => (layer.id === updatedLayer.id ? updatedLayer : layer)) }
          : slide
      ),
    });
  }, [commitConfig, config, currentSlideIndex]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    commitConfig({
      ...config,
      slides: config.slides.map((slide, index) =>
        index === currentSlideIndex
          ? { ...slide, layers: slide.layers.map((layer) => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)) }
          : slide
      ),
    });
  }, [commitConfig, config, currentSlideIndex]);

  const moveLayerUp = useCallback((layerId: string) => {
    const slide = config.slides[currentSlideIndex];
    if (!slide) return;

    const layers = [...slide.layers];
    const index = layers.findIndex((layer) => layer.id === layerId);
    const layer = layers[index];
    if (index === -1 || index >= layers.length - 1 || layer?.type === "background") {
      return;
    }

    const currentZIndex = layers[index].zIndex;
    layers[index].zIndex = layers[index + 1].zIndex;
    layers[index + 1].zIndex = currentZIndex;

    commitConfig({
      ...config,
      slides: config.slides.map((current, slideIndex) =>
        slideIndex === currentSlideIndex ? { ...slide, layers } : current
      ),
    });
  }, [commitConfig, config, currentSlideIndex]);

  const moveLayerDown = useCallback((layerId: string) => {
    const slide = config.slides[currentSlideIndex];
    if (!slide) return;

    const layers = [...slide.layers];
    const index = layers.findIndex((layer) => layer.id === layerId);
    const layer = layers[index];
    if (index === -1 || index === 0 || layer?.type === "background") {
      return;
    }

    const currentZIndex = layers[index].zIndex;
    layers[index].zIndex = layers[index - 1].zIndex;
    layers[index - 1].zIndex = currentZIndex;

    commitConfig({
      ...config,
      slides: config.slides.map((current, slideIndex) =>
        slideIndex === currentSlideIndex ? { ...slide, layers } : current
      ),
    });
  }, [commitConfig, config, currentSlideIndex]);

  const addLayer = useCallback((type: AddableLayerType) => {
    const slide = config.slides[currentSlideIndex];
    const maxZIndex = slide ? Math.max(...slide.layers.map((layer) => layer.zIndex)) : 0;
    const newLayer = createDefaultLayer(type, maxZIndex + 1);

    commitConfig({
      ...config,
      slides: config.slides.map((current, slideIndex) =>
        slideIndex === currentSlideIndex ? { ...current, layers: [...current.layers, newLayer] } : current
      ),
    });

    setSelectedLayerId(newLayer.id);
  }, [commitConfig, config, currentSlideIndex]);

  const deleteLayer = useCallback((layerId: string) => {
    const slide = config.slides[currentSlideIndex];
    if (!slide) return;

    const layerToDelete = slide.layers.find((layer) => layer.id === layerId);
    if (!layerToDelete || layerToDelete.type === "background") {
      return;
    }

    commitConfig({
      ...config,
      slides: config.slides.map((current, slideIndex) =>
        slideIndex === currentSlideIndex
          ? { ...current, layers: current.layers.filter((layer) => layer.id !== layerId) }
          : current
      ),
    });

    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  }, [commitConfig, config, currentSlideIndex, selectedLayerId]);

  const createSlide = useCallback(() => {
    const nextSlide = createSlideForDevice(projectName, config.slides.length + 1, selectedDeviceType);

    commitConfig({
      ...config,
      slides: [...config.slides, nextSlide],
    });

    setCurrentSlideIndex(config.slides.length);
    setSelectedLayerId(null);
  }, [commitConfig, config, projectName, selectedDeviceType]);

  const deleteSlide = useCallback((slideId: string) => {
    if (config.slides.length <= 1) {
      return;
    }

    const deleteIndex = config.slides.findIndex((slide) => slide.slideId === slideId);
    if (deleteIndex === -1) {
      return;
    }

    const nextSlides = config.slides.filter((slide) => slide.slideId !== slideId);
    commitConfig({
      ...config,
      slides: nextSlides,
    });

    setCurrentSlideIndex((current) => {
      if (current < deleteIndex) {
        return current;
      }

      return Math.max(0, Math.min(current - 1, nextSlides.length - 1));
    });
    setSelectedLayerId(null);
  }, [commitConfig, config]);

  const replaceConfig = useCallback((nextConfig: AiLayerTreeConfig) => {
    commitConfig(nextConfig);
  }, [commitConfig]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      return;
    }

    const nextIndex = historyIndexRef.current - 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setConfig(history[nextIndex]);
  }, [history]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= history.length - 1) {
      return;
    }

    const nextIndex = historyIndexRef.current + 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setConfig(history[nextIndex]);
  }, [history]);

  const requestExport = useCallback(() => {
    setExportRequest((current) => current + 1);
  }, []);

  const actions = useMemo(() => ({
    addLayer,
    createSlide,
    deleteSlide,
    deleteLayer,
    moveLayerDown,
    moveLayerUp,
    redo,
    replaceConfig,
    requestExport,
    toggleLayerVisibility,
    undo,
    updateLayer,
  }), [addLayer, createSlide, deleteLayer, deleteSlide, moveLayerDown, moveLayerUp, redo, replaceConfig, requestExport, toggleLayerVisibility, undo, updateLayer]);

  return {
    actions,
    backgroundLayer,
    config,
    currentDeviceLayer,
    currentSlide,
    currentSlideIndex,
    exportRequest,
    history,
    historyIndex,
    inspectorLayer,
    primaryImageLayer,
    primaryTextLayer,
    selectedLayer,
    selectedLayerId,
    setConfig,
    setCurrentSlideIndex,
    setSelectedLayerId,
  };
}
