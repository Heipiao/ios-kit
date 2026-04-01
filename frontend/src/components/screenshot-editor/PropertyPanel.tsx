"use client";

import React from "react";
import { Layer } from "@/lib/layer-tree-types";
import { FONT_OPTIONS, FRAME_REGISTRY } from "@/lib/layer-tree-mock";

interface PropertyPanelProps {
  layer: Layer | null;
  onChange: (layer: Layer) => void;
}

export default function PropertyPanel({ layer, onChange }: PropertyPanelProps) {
  if (!layer) {
    return (
      <div className="h-1/2 flex items-center justify-center text-gray-500">
        <span className="text-sm">请选择图层</span>
      </div>
    );
  }

  return (
    <div className="h-1/2 overflow-y-auto">
      <div className="px-4 py-2 border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-medium">属性</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* 通用属性 */}
        <Section title="位置">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="X"
              value={layer.x}
              onChange={(v) => onChange({ ...layer, x: v })}
            />
            <NumberInput
              label="Y"
              value={layer.y}
              onChange={(v) => onChange({ ...layer, y: v })}
            />
            <NumberInput
              label="宽度"
              value={layer.width}
              onChange={(v) => onChange({ ...layer, width: v })}
            />
            <NumberInput
              label="高度"
              value={layer.height}
              onChange={(v) => onChange({ ...layer, height: v })}
            />
          </div>
        </Section>

        <Section title="变换">
          <Slider
            label="旋转"
            value={layer.rotation || 0}
            min={0}
            max={360}
            onChange={(v) => onChange({ ...layer, rotation: v })}
          />
          <Slider
            label="透明度"
            value={layer.opacity || 1}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange({ ...layer, opacity: v })}
          />
        </Section>

        {/* 类型特定属性 */}
        {layer.type === "background" && (
          <BackgroundProperties layer={layer} onChange={onChange} />
        )}

        {layer.type === "image" && (
          <ImageProperties layer={layer} onChange={onChange} />
        )}

        {layer.type === "text" && (
          <TextProperties layer={layer} onChange={onChange} />
        )}

        {layer.type === "sticker" && (
          <StickerProperties layer={layer} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

// 属性区域组件
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400 uppercase">{title}</h4>
      {children}
    </div>
  );
}

// 数字输入组件
function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
      />
    </label>
  );
}

// 滑块组件
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-500">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
    </label>
  );
}

// 颜色选择组件
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
    </label>
  );
}

// 下拉选择组件
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// 背景层属性
function BackgroundProperties({
  layer,
  onChange,
}: {
  layer: any;
  onChange: (layer: any) => void;
}) {
  return (
    <>
      <Section title="背景类型">
        <Select
          label="类型"
          value={layer.bgType}
          options={[
            { value: "solid", label: "纯色" },
            { value: "gradient", label: "渐变" },
          ]}
          onChange={(v) => onChange({ ...layer, bgType: v as "solid" | "gradient" })}
        />
      </Section>

      {layer.bgType === "solid" && (
        <Section title="颜色">
          <ColorInput
            label="背景色"
            value={layer.color || "#667eea"}
            onChange={(v) => onChange({ ...layer, color: v })}
          />
        </Section>
      )}

      {layer.bgType === "gradient" && (
        <Section title="渐变">
          <ColorInput
            label="起始颜色"
            value={layer.gradient?.stops?.[0]?.color || "#667eea"}
            onChange={(v) =>
              onChange({
                ...layer,
                gradient: { ...layer.gradient, stops: [{ offset: 0, color: v }, { offset: 1, color: layer.gradient?.stops?.[1]?.color || "#764ba2" }] },
              })
            }
          />
          <div className="mt-2" />
          <ColorInput
            label="结束颜色"
            value={layer.gradient?.stops?.[1]?.color || "#764ba2"}
            onChange={(v) =>
              onChange({
                ...layer,
                gradient: { ...layer.gradient, stops: [{ offset: 0, color: layer.gradient?.stops?.[0]?.color || "#667eea" }, { offset: 1, color: v }] },
              })
            }
          />
        </Section>
      )}
    </>
  );
}

// 图片层属性
function ImageProperties({
  layer,
  onChange,
}: {
  layer: any;
  onChange: (layer: any) => void;
}) {
  return (
    <>
      <Section title="图片">
        <div className="text-xs text-gray-500">
          资源 ID: {layer.assetRef || "未设置"}
        </div>
        <button
          onClick={() => {}}
          className="w-full mt-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
        >
          替换图片
        </button>
      </Section>

      <Section title="填充模式">
        <Select
          label="填充"
          value={layer.fit}
          options={[
            { value: "cover", label: "Cover (填满)" },
            { value: "contain", label: "Contain (包含)" },
            { value: "fill", label: "Fill (拉伸)" },
          ]}
          onChange={(v) => onChange({ ...layer, fit: v as "cover" | "contain" | "fill" })}
        />
      </Section>

      <Section title="圆角">
        <Slider
          label="圆角"
          value={layer.cornerRadius || 0}
          min={0}
          max={100}
          onChange={(v) => onChange({ ...layer, cornerRadius: v })}
        />
      </Section>

      <Section title="设备边框">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={layer.showDeviceFrame || false}
            onChange={(e) => onChange({ ...layer, showDeviceFrame: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">显示设备边框</span>
        </label>

        {layer.showDeviceFrame && (
          <div className="mt-2">
            <Select
              label="边框样式"
              value={layer.frameRef || ""}
              options={Object.values(FRAME_REGISTRY).map((f) => ({
                value: f.id,
                label: f.name,
              }))}
              onChange={(v) => onChange({ ...layer, frameRef: v })}
            />
          </div>
        )}
      </Section>
    </>
  );
}

// 文字层属性
function TextProperties({
  layer,
  onChange,
}: {
  layer: any;
  onChange: (layer: any) => void;
}) {
  return (
    <>
      <Section title="内容">
        <textarea
          value={layer.content}
          onChange={(e) => onChange({ ...layer, content: e.target.value })}
          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
        />
      </Section>

      <Section title="字体">
        <Select
          label="字体"
          value={layer.fontFamily}
          options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
          onChange={(v) => onChange({ ...layer, fontFamily: v })}
        />
        <div className="mt-2" />
        <Slider
          label="字号"
          value={layer.fontSize}
          min={8}
          max={200}
          onChange={(v) => onChange({ ...layer, fontSize: v })}
        />
      </Section>

      <Section title="样式">
        <Select
          label="粗细"
          value={layer.fontWeight}
          options={[
            { value: "normal", label: "正常" },
            { value: "600", label: "半粗体" },
            { value: "bold", label: "粗体" },
            { value: "700", label: "特粗" },
          ]}
          onChange={(v) => onChange({ ...layer, fontWeight: v as any })}
        />
        <div className="mt-2" />
        <ColorInput
          label="颜色"
          value={layer.color}
          onChange={(v) => onChange({ ...layer, color: v })}
        />
      </Section>

      <Section title="对齐">
        <Select
          label="对齐方式"
          value={layer.align}
          options={[
            { value: "left", label: "左对齐" },
            { value: "center", label: "居中" },
            { value: "right", label: "右对齐" },
          ]}
          onChange={(v) => onChange({ ...layer, align: v as any })}
        />
      </Section>
    </>
  );
}

// 贴纸层属性
function StickerProperties({
  layer,
  onChange,
}: {
  layer: any;
  onChange: (layer: any) => void;
}) {
  return (
    <Section title="贴纸">
      <Select
        label="选择贴纸"
        value={layer.stickerId}
        options={[
          { value: "5g-badge", label: "5G 角标" },
          { value: "ai-chip", label: "AI 芯片" },
        ]}
        onChange={(v) => onChange({ ...layer, stickerId: v })}
      />
    </Section>
  );
}
