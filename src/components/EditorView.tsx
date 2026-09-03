import React from "react";
import MonacoEditor from "@monaco-editor/react";
import { FolderOpen } from "lucide-react";

interface EditorViewProps {
  activeFile: string;
  editorContent: string;
  onChangeContent: (val: string) => void;
  darkMode: boolean;
  toggleSidebar: () => void;
}

export default function EditorView({
  activeFile,
  editorContent,
  onChangeContent,
  darkMode,
  toggleSidebar
}: EditorViewProps) {
  return (
    <div className={`flex-1 flex flex-col border-r transition-all ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
      {/* Editor top status bar */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b ${darkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/50"}`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-500">{activeFile}</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
          title="Toggle Side Drawer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor mount frame */}
      <div className="flex-1 relative overflow-hidden">
        <MonacoEditor
          height="100%"
          language={activeFile.endsWith(".html") ? "html" : activeFile.endsWith(".css") ? "css" : "javascript"}
          theme={darkMode ? "vs-dark" : "light"}
          value={editorContent}
          onChange={(val) => {
            if (val !== undefined) {
              onChangeContent(val);
            }
          }}
          options={{
            fontSize: 13,
            fontFamily: "Fira Code, Menlo, Monaco, Consolas, monospace",
            minimap: { enabled: false },
            automaticLayout: true,
            padding: { top: 12 },
            lineNumbersMinChars: 3,
            wordWrap: "on"
          }}
        />
      </div>
    </div>
  );
}
