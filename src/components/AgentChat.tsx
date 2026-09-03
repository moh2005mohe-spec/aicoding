import React from "react";
import { Sparkles, Cpu, Send, CheckCircle2, RefreshCw } from "lucide-react";
import { Message } from "../types";

interface AgentChatProps {
  chatInput: string;
  setChatInput: (val: string) => void;
  onSubmitPrompt: (e: React.FormEvent) => void;
  isAgentThinking: boolean;
  agentStep: string;
  agentPlan: string[];
  agentThoughts: string;
  messages: Message[];
  darkMode: boolean;
}

export default function AgentChat({
  chatInput,
  setChatInput,
  onSubmitPrompt,
  isAgentThinking,
  agentStep,
  agentPlan,
  agentThoughts,
  messages,
  darkMode
}: AgentChatProps) {
  return (
    <div className={`w-80 border-l flex flex-col transition-all ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
      {/* Chat Titlebar */}
      <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50/50"}`}>
        <div className="flex items-center gap-2">
          <div className="w-6.5 h-6.5 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">ForgeAI Agent</h3>
            <p className="text-[9px] text-slate-400 font-medium">Autonomous Full-Stack Builder</p>
          </div>
        </div>
      </div>

      {/* Messages and Thinking Progress logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isAgentThinking && (
          <div className="text-center py-8 space-y-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">What shall we build?</h4>
              <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                Describe any feature, visual element, or API endpoint in Arabic or English to let the sandbox compile it.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`space-y-1.5 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <span className="text-[9px] text-slate-400 font-bold block">
              {msg.role === "user" ? "You" : "ForgeAI Builder"}
            </span>
            <div className={`inline-block text-xs p-3 rounded-2xl max-w-[90%] text-left ${
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-tr-none"
                : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none"
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Dynamic Thinking Progress Indicator */}
        {isAgentThinking && (
          <div className="space-y-3 p-3.5 bg-indigo-50/55 border border-indigo-100/60 rounded-2xl">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span className="text-xs font-bold text-indigo-900">Agent Reasoning</span>
            </div>
            <p className="text-[10px] text-indigo-700 font-semibold animate-pulse">{agentStep}</p>

            {agentPlan.length > 0 && (
              <div className="pt-2 border-t border-indigo-100/50 space-y-1.5">
                <span className="text-[9px] font-bold text-indigo-900 block uppercase">Drafting Execution Checklist:</span>
                {agentPlan.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[10px] text-indigo-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Chat Input bar */}
      <form onSubmit={onSubmitPrompt} className={`p-3 border-t flex gap-2 ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white"}`}>
        <input
          type="text"
          className="flex-1 text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="e.g. Add a beautiful task list..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isAgentThinking}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all disabled:opacity-50"
          disabled={isAgentThinking}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
