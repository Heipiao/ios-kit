"use client";

import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Group, Text } from "react-konva";
import { AiLayerTreeConfig, SlideConfig, Layer as LayerType } from "@/lib/layer-tree-types";
import { FRAME_REGISTRY } from "@/lib/layer-tree-mock";

interface CanvasPanelProps {
  config: AiLayerTreeConfig;
  slide: SlideConfig;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (layer: LayerType) => void;
}

export default function CanvasPanel({
  config,
  slide,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
}: CanvasPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!slide) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">无内容</div>;
  }

  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        加载中...
      </div>
    );
  }

  // 按 zIndex 排序图层
  const sortedLayers = [...slide.layers].sort((a, b) => a.zIndex - b.zIndex);

  // 计算画布缩放以适应容器
  const containerWidth = 600;
  const containerHeight = 800;
  const scaleX = containerWidth / config.exportedPngSize.w;
  const scaleY = containerHeight / config.exportedPngSize.h;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = config.exportedPngSize.w * scale;
  const scaledHeight = config.exportedPngSize.h * scale;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-auto bg-gray-700 p-8"
    >
      <div
        style={{
          width: scaledWidth,
          height: scaledHeight,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <Stage width={config.exportedPngSize.w} height={config.exportedPngSize.h} scale={{ x: scale, y: scale }}>
          <Layer>
            {/* 渲染所有图层 */}
            {sortedLayers.map((layer) => (
              <LayerRenderer
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerId === layer.id}
                onSelect={() => onSelectLayer(layer.id)}
                onUpdate={onUpdateLayer}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

// 图层渲染器
function LayerRenderer({
  layer,
  isSelected,
  onSelect,
  onUpdate,
}: {
  layer: LayerType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (layer: LayerType) => void;
}) {
  if (!layer.visible) return null;

  const commonProps = {
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    rotation: layer.rotation,
    opacity: layer.opacity,
    onClick: onSelect,
    onTap: onSelect,
  };

  // 选中框
  const SelectionBox = () =>
    isSelected ? (
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
    ) : null;

  switch (layer.type) {
    case "background":
      return (
        <Group>
          <BackgroundLayerComponent layer={layer} {...commonProps} />
          <SelectionBox />
        </Group>
      );

    case "image":
      return (
        <Group>
          <ImageLayerComponent layer={layer} {...commonProps} onUpdate={onUpdate} />
          <SelectionBox />
        </Group>
      );

    case "text":
      return (
        <Group>
          <TextLayerComponent layer={layer} {...commonProps} />
          <SelectionBox />
        </Group>
      );

    case "sticker":
      return (
        <Group>
          <StickerLayerComponent layer={layer} {...commonProps} />
          <SelectionBox />
        </Group>
      );

    default:
      return null;
  }
}

// 背景层渲染
function BackgroundLayerComponent({
  layer,
  ...props
}: {
  layer: any;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  if (layer.bgType === "solid") {
    return <Rect {...props} fill={layer.color} />;
  }

  if (layer.bgType === "gradient" && layer.gradient) {
    // Konva 渐变需要手动创建，这里简化处理
    return <Rect {...props} fill={layer.gradient.stops[0]?.color || "#667eea"} />;
  }

  return <Rect {...props} fill="#667eea" />;
}

// 图片层渲染
function ImageLayerComponent({
  layer,
  onUpdate,
  ...props
}: {
  layer: any;
  x: number;
  y: number;
  width: number;
  height: number;
  onUpdate: (layer: any) => void;
}) {
  // Mock 图片 - 使用彩色矩形代替
  const mockColor = layer.assetRef ? "#4a5568" : "#2d3748";

  return (
    <Group {...props}>
      {/* 图片占位 */}
      <Rect
        x={0}
        y={0}
        width={layer.width}
        height={layer.height}
        fill={mockColor}
        cornerRadius={layer.cornerRadius || 0}
      />

      {/* 设备边框 */}
      {layer.showDeviceFrame && layer.frameRef && (
        <>
          {/* 模拟屏幕内容区域 */}
          <Rect
            x={2}
            y={2}
            width={layer.width - 4}
            height={layer.height - 4}
            fill="#1a202c"
            cornerRadius={Math.max(0, (layer.cornerRadius || 0) - 2)}
          />
          {/* 模拟边框 */}
          <Rect
            x={0}
            y={0}
            width={layer.width}
            height={layer.height}
            fill="none"
            stroke="#718096"
            strokeWidth={3}
            cornerRadius={layer.cornerRadius || 0}
          />
        </>
      )}

      {/* 无图片提示 */}
      {!layer.assetRef && (
        <Text
          x={0}
          y={layer.height / 2 - 7}
          width={layer.width}
          text="点击上传图片"
          fontSize={14}
          fill="#a0aec0"
          align="center"
        />
      )}
    </Group>
  );
}

// 文字层渲染
function TextLayerComponent({
  layer,
  ...props
}: {
  layer: any;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <Text
      x={0}
      y={0}
      text={layer.content}
      fontFamily={layer.fontFamily}
      fontSize={layer.fontSize}
      fontStyle={layer.fontWeight === "bold" || layer.fontWeight === "700" ? "bold" : "normal"}
      fill={layer.color || "#ffffff"}
      align={layer.align}
      width={layer.width}
      height={layer.height}
      lineHeight={layer.lineHeight || 1.2}
      shadowColor={layer.textShadow?.color}
      shadowBlur={layer.textShadow?.blur || 0}
      shadowOffsetX={layer.textShadow?.offsetX || 0}
      shadowOffsetY={layer.textShadow?.offsetY || 0}
    />
  );
}

// 贴纸层渲染
function StickerLayerComponent({
  layer,
  ...props
}: {
  layer: any;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  // Mock 贴纸 - 使用圆形代替
  return <Circle {...props} radius={Math.min(layer.width, layer.height) / 2} fill="#fbbf24" />;
}
