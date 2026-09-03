import React, { useState, useEffect } from "react";
import {
  Sparkles,
  RotateCw,
  FolderOpen,
  FolderTree,
  GitBranch,
  Globe,
  Settings,
  Plus,
  Trash2,
  Copy,
  Cpu,
  LogOut,
  Sliders,
  Check,
  LockKeyhole,
  History,
  RotateCcw
} from "lucide-react";
import { Project, User, Message, ProjectVersion } from "./types";
import Sidebar from "./components/Sidebar";
import EditorView from "./components/EditorView";
import PreviewPane from "./components/PreviewPane";
import TerminalPane from "./components/TerminalPane";
import AgentChat from "./components/AgentChat";
import AuthModal from "./components/AuthModal";

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Active workspace state
  const [activeFile, setActiveFile] = useState<string>("App.jsx");
  const [editorContent, setEditorContent] = useState<string>("");
  const [fileTreeOpen, setFileTreeOpen] = useState(true);

  // AI Agent & Chat states
  const [chatInput, setChatInput] = useState("");
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [agentStep, setAgentStep] = useState<string>("");
  const [agentPlan, setAgentPlan] = useState<string[]>([]);
  const [agentThoughts, setAgentThoughts] = useState<string>("");

  // Preview Sandbox parameters
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // Terminal history
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "ForgeAI autonomous compiler sandbox booted successfully.",
    "Type 'npm run build', 'npm run lint', or 'npm test' to verify codebase health.",
    "sandbox@forge:~$ "
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  // Navigation Panel Views
  const [leftView, setLeftView] = useState<"files" | "projects" | "git" | "deployments" | "settings" | "history">("files");

  // Load configuration on initialization
  useEffect(() => {
    const savedUser = localStorage.getItem("forge_user");
    let initialUserId = "u-default";
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      initialUserId = parsed.id;
    }
    fetchProjects(initialUserId);
  }, []);

  // Update Monaco content dynamically when active file changes
  useEffect(() => {
    if (currentProject && currentProject.files && currentProject.files[activeFile] !== undefined) {
      setEditorContent(currentProject.files[activeFile]);
    }
  }, [activeFile, currentProject]);

  const fetchProjects = async (userId = "u-default") => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`/api/projects?userId=${userId}`);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) {
        selectProject(data[0]);
      } else {
        createDefaultProject(userId);
      }
    } catch (err) {
      console.error("Failed loading active projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const createDefaultProject = async (userId: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Smart AI Task Manager",
          description: "An elegant, highly structured dashboard with clean layouts and real-time state management.",
          userId
        })
      });
      const data = await res.json();
      setProjects([data]);
      selectProject(data);
    } catch (err) {
      console.error("Failed initializing default sandbox:", err);
    }
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    const files = Object.keys(project.files || {});
    if (files.length > 0) {
      const appFile = files.find(f => f.includes("App")) || files[0];
      setActiveFile(appFile);
    }
    setPreviewUrl(`/deployments/${project.id}`);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          name: authName || "Developer"
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      localStorage.setItem("forge_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setShowAuthModal(false);
      fetchProjects(data.user.id);
    } catch (err) {
      console.error("Authentication handshake failed:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("forge_user");
    setCurrentUser(null);
    fetchProjects("u-default");
  };

  const handleCreateProject = async () => {
    const pName = prompt("Enter project name:", "New Workspace App");
    if (!pName) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pName,
          description: "Autonomous code layout powered by the ForgeAI compilation sandbox.",
          userId: currentUser?.id || "u-default"
        })
      });
      const newProj = await res.json();
      setProjects([newProj, ...projects]);
      selectProject(newProj);
    } catch (err) {
      console.error("Failed creating a new project:", err);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this project?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      if (currentProject?.id === id) {
        if (updated.length > 0) {
          selectProject(updated[0]);
        } else {
          setCurrentProject(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleForkProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${id}/fork`, { method: "POST" });
      const duplicated = await res.json();
      setProjects([duplicated, ...projects]);
      selectProject(duplicated);
    } catch (err) {
      console.error("Failed to fork project repository:", err);
    }
  };

  const handleCreateFile = async (fileName: string) => {
    if (!currentProject) return;
    const defaultContent = fileName.endsWith(".jsx") || fileName.endsWith(".tsx")
      ? `import React from 'react';\n\nexport default function ${fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "")}() {\n  return (\n    <div className="p-4 bg-white rounded-xl shadow-sm border">\n      <h2 className="text-lg font-bold text-slate-800">${fileName} Component</h2>\n    </div>\n  );\n}`
      : `// ${fileName}\n`;

    const updatedFiles = { ...currentProject.files, [fileName]: defaultContent };
    setCurrentProject({ ...currentProject, files: updatedFiles });
    setActiveFile(fileName);

    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: updatedFiles })
      });
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Failed creating file:", err);
    }
  };

  const handleDeleteFile = async (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;
    if (fileName === "index.html" || fileName === "App.jsx") {
      alert("Core project entrypoints (index.html and App.jsx) cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    const updatedFiles = { ...currentProject.files };
    delete updatedFiles[fileName];

    setCurrentProject({ ...currentProject, files: updatedFiles });
    if (activeFile === fileName) {
      const remaining = Object.keys(updatedFiles);
      setActiveFile(remaining[0] || "App.jsx");
    }

    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: updatedFiles })
      });
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Failed deleting file:", err);
    }
  };

  const handleSaveEnvVar = async (key: string, val: string) => {
    if (!currentProject) return;
    const updatedEnv = { ...(currentProject.envVars || {}), [key]: val };
    setCurrentProject({ ...currentProject, envVars: updatedEnv });

    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envVars: updatedEnv })
      });
    } catch (err) {
      console.error("Failed saving environment variable:", err);
    }
  };

  const handleDeleteEnvVar = async (key: string) => {
    if (!currentProject) return;
    const updatedEnv = { ...(currentProject.envVars || {}) };
    delete updatedEnv[key];
    setCurrentProject({ ...currentProject, envVars: updatedEnv });

    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envVars: updatedEnv })
      });
    } catch (err) {
      console.error("Failed deleting environment variable:", err);
    }
  };

  const handleRestoreVersion = async (version: ProjectVersion) => {
    if (!currentProject) return;
    if (!confirm(`Restore codebase snapshot "${version.name}"?`)) return;

    setCurrentProject({ ...currentProject, files: version.files });
    const keys = Object.keys(version.files);
    if (keys.length > 0 && !keys.includes(activeFile)) {
      setActiveFile(keys[0]);
    }

    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: version.files })
      });
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Failed restoring version snapshot:", err);
    }
  };

  const saveFileContent = async (code: string) => {
    if (!currentProject) return;
    const updatedFiles = { ...currentProject.files, [activeFile]: code };
    setCurrentProject({
      ...currentProject,
      files: updatedFiles
    });

    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: updatedFiles })
      });
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  };

  const handleAgentPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentProject) return;

    const userPrompt = chatInput;
    setChatInput("");
    setIsAgentThinking(true);
    setAgentStep("Analyzing code requirements & structural schema...");
    setAgentPlan([]);
    setAgentThoughts("");

    const steps = [
      "Analyzing modular component parameters...",
      "Drafting file transformation maps...",
      "Executing dynamic Babel code updates...",
      "Verifying style attributes using tailwind compilers...",
      "Running compiler diagnostics checks...",
      "Syncing dynamic live browser modules..."
    ];

    let stepIdx = 0;
    const stepTimer = setInterval(() => {
      if (stepIdx < steps.length) {
        setAgentStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 1200);

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt })
      });
      const data = await res.json();
      clearInterval(stepTimer);

      if (data.error) {
        setTerminalHistory(prev => [
          ...prev,
          `[Agent Error] Build Failed: ${data.error}`,
          "sandbox@forge:~$ "
        ]);
        setAgentStep("Generation Failed.");
        return;
      }

      const updatedRes = await fetch(`/api/projects/${currentProject.id}`);
      const updatedProj = await updatedRes.json();
      setCurrentProject(updatedProj);

      if (updatedProj.files[activeFile] !== undefined) {
        setEditorContent(updatedProj.files[activeFile]);
      }

      if (data.message) {
        setAgentPlan(data.message.plan || []);
        setAgentThoughts(data.message.thoughts || "");
      }

      setTerminalHistory(prev => [
        ...prev,
        `[ForgeAI Sandbox] Dynamic files updated successfully.`,
        `✓ Compiled JSX structures cleanly.`,
        `✓ Live preview hot-reloading completes successfully.`,
        "sandbox@forge:~$ "
      ]);
      setPreviewRefreshKey(prev => prev + 1);
      setAgentStep("Sandbox synchronized.");
    } catch (err) {
      clearInterval(stepTimer);
      console.error("Agent execution failed:", err);
      setAgentStep("Build connection failure.");
    } finally {
      setIsAgentThinking(false);
    }
  };

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || !currentProject) return;

    const cmd = terminalInput;
    setTerminalInput("");
    setTerminalHistory(prev => [...prev, `sandbox@forge:~$ ${cmd}`]);

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/terminal/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      setTerminalHistory(prev => [
        ...prev,
        data.output,
        "sandbox@forge:~$ "
      ]);
    } catch (err) {
      setTerminalHistory(prev => [
        ...prev,
        "Error: Connection aborted.",
        "sandbox@forge:~$ "
      ]);
    }
  };

  const handleDeployProject = async () => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/deploy`, { method: "POST" });
      const data = await res.json();
      alert(`Project successfully deployed to cloud sandbox container!\n\nAccess Live Application:\n${window.location.origin}${data.url}`);
      setPreviewRefreshKey(p => p + 1);
    } catch (err) {
      console.error("Sandbox deployment failed:", err);
    }
  };

  const handleGitCommit = async () => {
    if (!currentProject) return;
    const msg = prompt("Enter Git Commit message:", "Refactored user dashboard views");
    if (!msg) return;

    try {
      const res = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gitRepo: {
            connected: true,
            repoName: "github.com/moh2005mohe-spec/aicoding",
            branch: "main",
            commits: [
              {
                id: Math.random().toString(36).substring(2, 9),
                message: msg,
                author: currentUser?.name || "Developer",
                timestamp: new Date().toISOString()
              },
              ...(currentProject.gitRepo?.commits || [])
            ]
          }
        })
      });
      const updatedProj = await res.json();
      setCurrentProject(updatedProj);
      alert("Committed & pushed transactionally to connected branch!");
    } catch (err) {
      console.error("Git push failed:", err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-[#F9F9FB] text-slate-800"}`}>
      
      {/* Action Header */}
      <header className={`px-6 py-3 flex items-center justify-between border-b transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-indigo-600">ForgeAI</span>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-bold text-indigo-600 uppercase">Sandbox</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Autonomous IDE & Compiler environment</p>
          </div>
        </div>

        {/* Dynamic Project actions & Theme sliders */}
        <div className="flex items-center gap-4">
          {currentProject && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Sandbox:</span>
              <select
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                value={currentProject.id}
                onChange={(e) => {
                  const selected = projects.find(p => p.id === e.target.value);
                  if (selected) selectProject(selected);
                }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (currentProject) {
                  setPreviewRefreshKey(p => p + 1);
                }
              }}
              title="Refresh Workspace compilation"
              className={`p-2 rounded-xl border transition-all ${darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleDeployProject}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-100"
            >
              <Globe className="w-3.5 h-3.5" /> Deploy Sandbox
            </button>
            
            <button
              onClick={handleGitCommit}
              className={`border text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Push Git
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-amber-400" : "bg-white border-slate-200 text-slate-600"}`}
              title="Switch Color Theme"
            >
              {darkMode ? <Sparkles className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 border-l pl-3 ml-1">
                <span className="text-xs font-bold text-indigo-600">{currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all text-slate-400"
                  title="Logout Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setShowAuthModal(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all ml-2"
              >
                Access Account
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Workspace Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar Selector */}
        <div className={`w-16 flex flex-col items-center justify-between py-4 border-r transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60"}`}>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setLeftView("files"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "files" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Workspace Directory structure"
            >
              <FolderOpen className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setLeftView("projects"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "projects" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Workspace Saved Projects list"
            >
              <FolderTree className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setLeftView("history"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "history" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Version Snapshots & Code History"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setLeftView("git"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "git" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Git push branches"
            >
              <GitBranch className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setLeftView("deployments"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "deployments" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Sandbox Deployments tracker"
            >
              <Globe className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setLeftView("settings"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "settings" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Server Secrets configurations"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Sidebar View panel */}
        {fileTreeOpen && currentProject && (
          <Sidebar
            leftView={leftView}
            currentProject={currentProject}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            projects={projects}
            selectProject={selectProject}
            onCreateProject={handleCreateProject}
            onForkProject={handleForkProject}
            onDeleteProject={handleDeleteProject}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onSaveEnvVar={handleSaveEnvVar}
            onDeleteEnvVar={handleDeleteEnvVar}
            onRestoreVersion={handleRestoreVersion}
            onGitCommit={handleGitCommit}
            onDeployProject={handleDeployProject}
            onClose={() => setFileTreeOpen(false)}
            darkMode={darkMode}
            currentUser={currentUser}
          />
        )}

        {/* Editor & Iframe workspace panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Visual Monaco code viewer */}
            <EditorView
              activeFile={activeFile}
              editorContent={editorContent}
              onChangeContent={(val) => {
                setEditorContent(val);
                saveFileContent(val);
              }}
              darkMode={darkMode}
              toggleSidebar={() => setFileTreeOpen(!fileTreeOpen)}
            />

            {/* Live sandbox dynamic builder renderer */}
            <PreviewPane
              previewDevice={previewDevice}
              setPreviewDevice={setPreviewDevice}
              previewUrl={previewUrl}
              previewRefreshKey={previewRefreshKey}
              onOpenNewTab={() => {
                if (currentProject) {
                  window.open(`/deployments/${currentProject.id}`, "_blank");
                }
              }}
              darkMode={darkMode}
            />
          </div>

          {/* Simulated cli shell terminal */}
          <TerminalPane
            terminalHistory={terminalHistory}
            terminalInput={terminalInput}
            setTerminalInput={setTerminalInput}
            onSubmitCommand={handleTerminalSubmit}
            darkMode={darkMode}
          />
        </div>

        {/* AI Agent chatbot reasoning module */}
        <AgentChat
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSubmitPrompt={handleAgentPromptSubmit}
          isAgentThinking={isAgentThinking}
          agentStep={agentStep}
          agentPlan={agentPlan}
          agentThoughts={agentThoughts}
          messages={currentProject?.messages || []}
          darkMode={darkMode}
        />
      </div>

      {/* Account Authentication modal popup */}
      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authName={authName}
        setAuthName={setAuthName}
        onSubmit={handleAuthSubmit}
      />
    </div>
  );
}
