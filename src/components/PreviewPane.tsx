import React from "react";
import { Monitor, Tablet, Smartphone, Globe, ExternalLink } from "lucide-react";

interface PreviewPaneProps {
  previewDevice: "desktop" | "tablet" | "mobile";
  setPreviewDevice: (device: "desktop" | "tablet" | "mobile") => void;
  previewUrl: string;
  previewRefreshKey: number;
  onOpenNewTab: () => void;
  darkMode: boolean;
}

export default function PreviewPane({
  previewDevice,
  setPreviewDevice,
  previewUrl,
  previewRefreshKey,
  onOpenNewTab,
  darkMode
}: PreviewPaneProps) {
  return (
    <div className={`flex-1 flex flex-col transition-all ${darkMode ? "bg-slate-950" : "bg-[#F3F4F6]"}`}>
      {/* Simulated Browser Chrome Bar */}
      <div className={`px-4 py-2 flex items-center justify-between border-b ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className={`text-xs px-3 py-1 rounded-lg border flex items-center gap-1.5 ml-4 ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-100 text-slate-500"}`}>
            <Globe className="w-3 h-3 text-indigo-500" />
            <span className="font-semibold select-all">https://sandbox.forgeai.local{previewUrl}</span>
          </div>
        </div>

        {/* Viewport resizing presets */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreviewDevice("desktop")}
            className={`p-1.5 rounded-lg transition-all ${previewDevice === "desktop" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPreviewDevice("tablet")}
            className={`p-1.5 rounded-lg transition-all ${previewDevice === "tablet" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
            title="Tablet view"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPreviewDevice("mobile")}
            className={`p-1.5 rounded-lg transition-all ${previewDevice === "mobile" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
            title="Mobile view"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <div className="border-l border-slate-200 pl-2 ml-1">
            <button
              onClick={onOpenNewTab}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Actual Iframe Render Sandbox */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div
          className="h-full max-h-full rounded-2xl shadow-xl overflow-hidden bg-white border border-slate-200/80 transition-all duration-300"
          style={{
            width: previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "768px" : "375px"
          }}
        >
          <iframe
            key={previewRefreshKey}
            src={`${previewUrl}?t=${previewRefreshKey}`}
            className="w-full h-full border-none"
            title="Sandbox Live Preview"
          />
        </div>
      </div>
    </div>
  );
}
