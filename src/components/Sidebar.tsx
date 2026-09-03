import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  Plus,
  Trash2,
  FolderTree,
  Copy,
  GitBranch,
  Globe,
  Settings,
  LockKeyhole,
  Check,
  X
} from "lucide-react";
import { Project, User } from "../types";

interface SidebarProps {
  leftView: "files" | "projects" | "git" | "deployments" | "settings";
  currentProject: Project | null;
  activeFile: string;
  setActiveFile: (file: string) => void;
  projects: Project[];
  selectProject: (p: Project) => void;
  onCreateProject: () => void;
  onForkProject: (id: string, e: any) => void;
  onDeleteProject: (id: string, e: any) => void;
  onGitCommit: () => void;
  onDeployProject: () => void;
  onClose: () => void;
  darkMode: boolean;
  currentUser: User | null;
}

export default function Sidebar({
  leftView,
  currentProject,
  activeFile,
  setActiveFile,
  projects,
  selectProject,
  onCreateProject,
  onForkProject,
  onDeleteProject,
  onGitCommit,
  onDeployProject,
  onClose,
  darkMode,
  currentUser
}: SidebarProps) {
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [envVars, setEnvVars] = useState<Array<{ key: string; val: string }>>([
    { key: "DATABASE_URL", val: "postgresql://postgres:*****@cloudsql.forgeai.internal/app" },
    { key: "STRIPE_SECRET_KEY", val: "sk_test_51Nv***********************" }
  ]);

  if (!currentProject) return null;

  const handleAddEnv = () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) return;
    setEnvVars([...envVars, { key: newEnvKey.trim(), val: newEnvValue.trim() }]);
    setNewEnvKey("");
    setNewEnvValue("");
  };

  const handleRemoveEnv = (key: string) => {
    setEnvVars(envVars.filter(e => e.key !== key));
  };

  return (
    <div className={`w-64 border-r flex flex-col transition-colors ${darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-800"}`}>
      {/* Sidebar Header */}
      <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {leftView === "files" && "Virtual Filesystem"}
          {leftView === "projects" && "Saved Workspace"}
          {leftView === "git" && "Git Repository"}
          {leftView === "deployments" && "Deployments"}
          {leftView === "settings" && "Config & Secrets"}
        </span>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sidebar Content Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* FILES EXPLORER VIEW */}
        {leftView === "files" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-600" /> /sandbox
              </span>
              <button
                onClick={() => {
                  const newName = prompt("Enter new filename (e.g., helper.js):");
                  if (!newName) return;
                  setActiveFile(newName);
                }}
                className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-500 transition-colors"
                title="Create File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {Object.keys(currentProject.files || {}).map((fName) => (
                <button
                  key={fName}
                  onClick={() => setActiveFile(fName)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFile === fName
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" /> {fName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PROJECTS MANAGER VIEW */}
        {leftView === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Recent Projects</span>
              <button
                onClick={onCreateProject}
                className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => selectProject(p)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    currentProject?.id === p.id
                      ? "bg-indigo-50/50 border-indigo-200"
                      : darkMode
                      ? "bg-slate-800/50 border-slate-800 hover:bg-slate-800"
                      : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm"
                  }`}
                >
                  <h4 className="font-bold text-xs text-slate-900">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50">
                    <span className="text-[9px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => onForkProject(p.id, e)}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded"
                        title="Fork Project"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => onDeleteProject(p.id, e)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GIT HISTORY VIEW */}
        {leftView === "git" && (
          <div className="space-y-4">
            <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200/60"}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <GitBranch className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> connected-repo
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium truncate">github.com/moh2005mohe-spec/aicoding</p>
              <button
                onClick={onGitCommit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg mt-3 transition-colors shadow-sm shadow-indigo-100"
              >
                Commit & Push Changes
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commit History</span>
              {currentProject.gitRepo?.commits && currentProject.gitRepo.commits.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
                  {currentProject.gitRepo.commits.map((c) => (
                    <div key={c.id} className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white"></span>
                      <div className="text-xs font-bold text-slate-800">{c.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{c.author} · {c.id}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No local commits recorded.</div>
              )}
            </div>
          </div>
        )}

        {/* DEPLOYMENTS VIEW */}
        {leftView === "deployments" && (
          <div className="space-y-4">
            <button
              onClick={onDeployProject}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition-colors"
            >
              Trigger Sandbox Build
            </button>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Domains</span>
              {currentProject.deployments && currentProject.deployments.length > 0 ? (
                currentProject.deployments.map((d) => (
                  <div key={d.id} className={`p-3 border rounded-xl space-y-1 ${darkMode ? "bg-slate-800/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Production</span>
                      <span className="text-[9px] text-slate-400">{new Date(d.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs font-bold text-indigo-600 truncate">{d.url}</div>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-1.5 font-bold transition-colors"
                    >
                      Open Deployment
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[11px] text-slate-400">No active production endpoints.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONFIG & SETRETS SETTINGS VIEW */}
        {leftView === "settings" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ForgeAI Secrets</span>
              <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-800/40 border-slate-800" : "bg-indigo-50/50 border-indigo-100"}`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <LockKeyhole className="w-3.5 h-3.5 text-indigo-600" /> Server API Secret Key
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Gemini SDK calls are proxied securely on the backend. No credentials are leaked to the client browser.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-bold text-slate-400 bg-white border px-2 py-1 rounded w-full flex items-center justify-between">
                    <span>••••••••••••••••••••</span>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Environment Variables</span>
              <div className="space-y-2">
                {envVars.map((env) => (
                  <div key={env.key} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border text-xs">
                    <div className="truncate pr-2">
                      <div className="text-[10px] font-extrabold text-slate-700">{env.key}</div>
                      <div className="text-[9px] text-slate-400 truncate">{env.val}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveEnv(env.key)}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t space-y-2">
                <input
                  type="text"
                  placeholder="Key (e.g. STRIPE_KEY)"
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Value"
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                />
                <button
                  onClick={handleAddEnv}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors"
                >
                  Add variable
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
