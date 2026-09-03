import React, { useRef, useEffect } from "react";
import { Terminal, Send, RefreshCw } from "lucide-react";

interface TerminalPaneProps {
  terminalHistory: string[];
  terminalInput: string;
  setTerminalInput: (val: string) => void;
  onSubmitCommand: (e: React.FormEvent) => void;
  darkMode: boolean;
}

export default function TerminalPane({
  terminalHistory,
  terminalInput,
  setTerminalInput,
  onSubmitCommand,
  darkMode
}: TerminalPaneProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalHistory]);

  return (
    <div className={`h-48 border-t flex flex-col font-mono text-xs transition-all ${darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-900 border-slate-800 text-slate-200"}`}>
      {/* Terminal Titlebar */}
      <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950">
        <div className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Interactive Terminal Sandbox
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> active-session
        </div>
      </div>

      {/* Terminal history stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 select-text scrollbar-thin">
        {terminalHistory.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap leading-relaxed">
            {line.startsWith("sandbox@forge") ? (
              <span className="text-indigo-400 font-bold">{line}</span>
            ) : line.includes("✓") || line.includes("success") ? (
              <span className="text-emerald-400">{line}</span>
            ) : line.includes("✗") || line.includes("Error") ? (
              <span className="text-rose-400">{line}</span>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Terminal prompt form input */}
      <form onSubmit={onSubmitCommand} className="flex items-center border-t border-slate-800/80 bg-slate-950/80">
        <span className="pl-3 text-indigo-400 font-bold select-none">sandbox@forge:~$</span>
        <input
          type="text"
          className="flex-1 bg-transparent px-2.5 py-2 outline-none text-white placeholder-slate-600 focus:ring-0"
          placeholder="npm run build, npm run lint, vitest, or describe changes..."
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
        />
        <button type="submit" className="p-2 text-slate-400 hover:text-white transition-colors">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
