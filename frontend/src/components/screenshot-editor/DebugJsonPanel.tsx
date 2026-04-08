"use client";

import type { AiLayerTreeConfig } from "@/lib/layer-tree-types";

interface DebugJsonPanelProps {
  config: AiLayerTreeConfig;
}

export default function DebugJsonPanel({ config }: DebugJsonPanelProps) {
  return (
    <div className="flex h-full flex-col bg-[#f7f3e8]">
      <div className="border-b-2 border-black bg-white px-4 py-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">Debug Mode</p>
        <h3 className="mt-1 font-display text-xl uppercase leading-none">Raw JSON</h3>
      </div>

      <pre className="flex-1 overflow-auto p-4 text-xs leading-5 text-gray-800">
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
}
