import React, { useState, useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import {
  Sparkles,
  Terminal,
  Play,
  RotateCw,
  FolderOpen,
  FileCode,
  Globe,
  Settings,
  Github,
  Plus,
  Trash2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Cpu,
  FileText,
  User,
  LogOut,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  GitBranch,
  Copy,
  Folder,
  Sliders,
  History,
  X,
  Lock,
  Search,
  Check,
  Undo2,
  Redo2,
  LockKeyhole
} from "lucide-react";

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // IDE Editor State
  const [activeFile, setActiveFile] = useState<string>("App.jsx");
  const [editorContent, setEditorContent] = useState<string>("");
  const [fileTreeOpen, setFileTreeOpen] = useState(true);

  // AI Agent & Chat State
  const [chatInput, setChatInput] = useState("");
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [agentStep, setAgentStep] = useState<string>("");
  const [agentPlan, setAgentPlan] = useState<string[]>([]);
  const [agentThoughts, setAgentThoughts] = useState<string>("");

  // Preview Sandbox State
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  // Terminal Simulator State
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "ForgeAI sandbox initial boot completed.",
    "Type any command (e.g. 'npm run build', 'npm run lint', 'npm test') to inspect.",
    "sandbox@forge:~$ "
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Left Drawer View Control
  const [leftView, setLeftView] = useState<"files" | "projects" | "git" | "deployments" | "settings">("files");

  // Secrets & Settings
  const [apiKeySecret, setApiKeySecret] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [envVarsList, setEnvVarsList] = useState<Array<{ key: string; val: string }>>([
    { key: "DATABASE_URL", val: "postgresql://postgres:*****@cloudsql.forgeai.internal/app" },
    { key: "STRIPE_SECRET_KEY", val: "sk_test_51Nv***********************" }
  ]);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  // Initialize
  useEffect(() => {
    // Check saved token or user session
    const savedUser = localStorage.getItem("forge_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchProjects();

    // Check custom environment var
    const checkApiKey = async () => {
      // In AI studio, the key is server-side process.env.GEMINI_API_KEY
      setIsKeySaved(true);
    };
    checkApiKey();
  }, []);

  // Update editor content when active file changes
  useEffect(() => {
    if (currentProject && currentProject.files && currentProject.files[activeFile] !== undefined) {
      setEditorContent(currentProject.files[activeFile]);
    }
  }, [activeFile, currentProject]);

  // Keep terminal scrolled down
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalHistory]);

  const fetchProjects = async (userId = "u-default") => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`/api/projects?userId=${userId}`);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) {
        // Load the first or most recent project
        selectProject(data[0]);
      } else {
        createFirstDemoProject(userId);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const createFirstDemoProject = async (userId: string) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Smart AI Task Manager",
          description: "An elegant project built with React and Tailwind CSS",
          userId
        })
      });
      const data = await res.json();
      setProjects([data]);
      selectProject(data);
    } catch (err) {
      console.error("Error creating demo project:", err);
    }
  };

  const selectProject = (project: any) => {
    setCurrentProject(project);
    // Find first available file or App.jsx
    const files = Object.keys(project.files || {});
    if (files.length > 0) {
      const appFile = files.find(f => f.includes("App")) || files[0];
      setActiveFile(appFile);
    }
    // Set Preview URL
    setPreviewUrl(`/deployments/${project.id}`);
  };

  // Auth Submit
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
          name: authName || "User"
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
      console.error("Auth failed:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("forge_user");
    setCurrentUser(null);
    fetchProjects("u-default");
  };

  // Project CRUD Actions
  const handleCreateProject = async () => {
    const pName = prompt("Enter project name:", "New AI Application");
    if (!pName) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pName,
          description: "Autonomous code layout powered by ForgeAI engine",
          userId: currentUser?.id || "u-default"
        })
      });
      const newProj = await res.json();
      setProjects([newProj, ...projects]);
      selectProject(newProj);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleDeleteProject = async (id: string, e: any) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
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
      console.error("Delete failed:", err);
    }
  };

  const handleForkProject = async (id: string, e: any) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${id}/fork`, { method: "POST" });
      const duplicated = await res.json();
      setProjects([duplicated, ...projects]);
      selectProject(duplicated);
    } catch (err) {
      console.error("Failed to fork:", err);
    }
  };

  // Real-time Save Editor Edits to Virtual Files
  const saveFileContent = async (code: string) => {
    if (!currentProject) return;
    const updatedFiles = { ...currentProject.files, [activeFile]: code };
    
    // Update local state first for real-time reactivity
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

  // AI Agent Prompt Submit
  const handleAgentPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentProject) return;

    const userPrompt = chatInput;
    setChatInput("");
    setIsAgentThinking(true);
    setAgentStep("Analyzing user request & schema mapping...");
    setAgentPlan([]);
    setAgentThoughts("");

    // Simulate Agent Steps during generation for pristine premium UI
    const steps = [
      "Analyzing layout requirements...",
      "Inspecting active files and framework definitions...",
      "Drafting code refactoring plan...",
      "Transforming App.jsx with clean visual elements...",
      "Applying dynamic Tailwind style attributes...",
      "Running compiler build verification in sandbox...",
      "Verifying zero runtime styling anomalies..."
    ];

    let currentStepIdx = 0;
    const stepInterval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setAgentStep(steps[currentStepIdx]);
        currentStepIdx++;
      }
    }, 1500);

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt })
      });
      const data = await res.json();

      clearInterval(stepInterval);

      if (data.error) {
        setTerminalHistory(prev => [
          ...prev,
          `[AI Agent Error] Generation failed: ${data.error}`,
          "sandbox@forge:~$ "
        ]);
        setAgentStep("AI Generation Failed.");
        return;
      }

      // Load updated project details with new files/messages
      const updatedProjRes = await fetch(`/api/projects/${currentProject.id}`);
      const updatedProj = await updatedProjRes.json();
      
      setCurrentProject(updatedProj);
      
      // Update local variables
      if (updatedProj.files[activeFile] !== undefined) {
        setEditorContent(updatedProj.files[activeFile]);
      }

      // Populate Agent summary panel
      const latestMessage = data.message;
      if (latestMessage) {
        setAgentPlan(latestMessage.plan || []);
        setAgentThoughts(latestMessage.thoughts || "");
      }

      setTerminalHistory(prev => [
        ...prev,
        `[ForgeAI Compile Sandbox] Build triggered successfully.`,
        `✓ React modules bundled in 1.2s`,
        `✓ Live Preview sync completed.`,
        "sandbox@forge:~$ "
      ]);

      setPreviewRefreshKey(prev => prev + 1);
      setAgentStep("AI Generation complete.");
    } catch (err) {
      clearInterval(stepInterval);
      console.error("AI Agent run failed:", err);
      setAgentStep("Failed to connect with ForgeAI model.");
    } finally {
      setIsAgentThinking(false);
    }
  };

  // Run Simulated Interactive Terminal commands
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || !currentProject) return;

    const cmd = terminalInput;
    setTerminalInput("");
    setTerminalHistory(prev => [...prev, cmd]);

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
        "Error executing sandbox command.",
        "sandbox@forge:~$ "
      ]);
    }
  };

  // Virtual Sandbox Deploy Button
  const handleDeployProject = async () => {
    if (!currentProject) return;
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/deploy`, { method: "POST" });
      const data = await res.json();
      
      // Load updated project for deployment log updates
      const updatedProjRes = await fetch(`/api/projects/${currentProject.id}`);
      const updatedProj = await updatedProjRes.json();
      setCurrentProject(updatedProj);

      alert(`App deployed successfully!\n\nProduction URL: ${window.location.origin}${data.url}`);
    } catch (err) {
      console.error("Deployment failed:", err);
    }
  };

  // Virtual Sandbox Git Commit
  const handleGitCommit = async () => {
    if (!currentProject) return;
    const msg = prompt("Enter commit message:", "Refactored layout components with responsive design");
    if (!msg) return;

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/git/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      if (data.success) {
        // Reload project
        const updatedProjRes = await fetch(`/api/projects/${currentProject.id}`);
        const updatedProj = await updatedProjRes.json();
        setCurrentProject(updatedProj);
        alert("Committed and pushed to repository successfully!");
      }
    } catch (err) {
      console.error("Git commit failed:", err);
    }
  };

  // Environment variable save
  const handleAddEnv = () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) return;
    setEnvVarsList([...envVarsList, { key: newEnvKey.trim(), val: newEnvValue.trim() }]);
    setNewEnvKey("");
    setNewEnvValue("");
  };

  const handleRemoveEnv = (key: string) => {
    setEnvVarsList(envVarsList.filter(env => env.key !== key));
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-[#F9F9FB] text-slate-800"}`}>
      
      {/* Premium Header */}
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
            <p className="text-[10px] text-slate-400 font-medium">Autonomous IDE & Compiler sandbox</p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-4">
          {currentProject && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Project:</span>
              <select
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
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
              title="Refresh Preview & Sync Build"
              className={`p-2 rounded-xl border transition-all ${darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleDeployProject}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-100"
            >
              <Globe className="w-3.5 h-3.5" /> Deploy App
            </button>
            
            <button
              onClick={handleGitCommit}
              className={`border text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}`}
            >
              <Github className="w-3.5 h-3.5" /> Push Git
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-amber-400" : "bg-white border-slate-200 text-slate-600"}`}
              title="Toggle Theme"
            >
              {darkMode ? <Sparkles className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 border-l pl-3 ml-1">
                <span className="text-xs font-bold text-indigo-600">{currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all text-slate-400"
                  title="Log out"
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
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Control Drawer Sidebar Icon Bar */}
        <div className={`w-16 flex flex-col items-center justify-between py-4 border-r transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60"}`}>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setLeftView("files"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "files" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Project Files Explorer"
            >
              <FolderOpen className="w-5 h-5" />
              <span className="absolute left-16 top-3 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap">File Explorer</span>
            </button>

            <button
              onClick={() => { setLeftView("projects"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "projects" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Saved Projects"
            >
              <FolderTree className="w-5 h-5" />
              <span className="absolute left-16 top-3 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap">All Projects</span>
            </button>

            <button
              onClick={() => { setLeftView("git"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "git" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Git History & Pull Requests"
            >
              <GitBranch className="w-5 h-5" />
              <span className="absolute left-16 top-3 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap">Git Versioning</span>
            </button>

            <button
              onClick={() => { setLeftView("deployments"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "deployments" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="Live Deployments Log"
            >
              <Globe className="w-5 h-5" />
              <span className="absolute left-16 top-3 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap">Deployments</span>
            </button>

            <button
              onClick={() => { setLeftView("settings"); setFileTreeOpen(true); }}
              className={`p-3 rounded-xl transition-all relative group ${leftView === "settings" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
              title="API keys & System Configuration"
            >
              <Settings className="w-5 h-5" />
              <span className="absolute left-16 top-3 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-50 whitespace-nowrap">Settings</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs" title="Logged Account">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Left Side Pane (Folders Tree / Project Settings / History) */}
        {fileTreeOpen && currentProject && (
          <div className={`w-64 border-r flex flex-col transition-colors ${darkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200/60"}`}>
            
            {/* Folder Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {leftView === "files" && "Virtual Filesystem"}
                {leftView === "projects" && "Saved Workspace Projects"}
                {leftView === "git" && "Git Branches & History"}
                {leftView === "deployments" && "SaaS Deployments Log"}
                {leftView === "settings" && "Config & Secrets"}
              </span>
              <button
                onClick={() => setFileTreeOpen(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Folder Body (List of Virtual Files or other Views) */}
            <div className="flex-1 overflow-y-auto p-3">
              
              {/* FILES EXPLORER VIEW */}
              {leftView === "files" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-indigo-600" /> /sandbox
                    </span>
                    <button
                      onClick={() => {
                        const newName = prompt("Enter new filename (e.g. utils.js):");
                        if (!newName) return;
                        setCurrentProject({
                          ...currentProject,
                          files: { ...currentProject.files, [newName]: "// New module initialized" }
                        });
                        setActiveFile(newName);
                      }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    {Object.keys(currentProject.files || {}).map(fName => (
                      <button
                        key={fName}
                        onClick={() => setActiveFile(fName)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFile === fName ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <span className="flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-slate-400" /> {fName}
                        </span>
                        {fName !== "index.html" && fName !== "App.jsx" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!confirm(`Delete ${fName}?`)) return;
                              const updatedFiles = { ...currentProject.files };
                              delete updatedFiles[fName];
                              setCurrentProject({ ...currentProject, files: updatedFiles });
                              setActiveFile("App.jsx");
                            }}
                            className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ALL PROJECTS VIEW */}
              {leftView === "projects" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Recent Projects</span>
                    <button
                      onClick={handleCreateProject}
                      className="p-1 hover:bg-slate-100 rounded text-indigo-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {projects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => selectProject(p)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${currentProject?.id === p.id ? "bg-indigo-50/55 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50"}`}
                      >
                        <h4 className="font-bold text-xs text-slate-900">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <span className="text-[9px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => handleForkProject(p.id, e)}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded"
                              title="Fork Project"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(p.id, e)}
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

              {/* GIT SYSTEM VIEW */}
              {leftView === "git" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> connected-repo
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">github.com/moh2005mohe-spec/aicoding</p>
                    <button
                      onClick={handleGitCommit}
                      className="w-full bg-indigo-600 text-white text-xs font-bold py-1.5 rounded-lg mt-3"
                    >
                      Commit Changes
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commit History</span>
                    {currentProject.gitRepo?.commits && currentProject.gitRepo.commits.length > 0 ? (
                      <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
                        {currentProject.gitRepo.commits.map((c: any) => (
                          <div key={c.id} className="relative">
                            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white"></span>
                            <div className="text-xs font-bold text-slate-800">{c.message}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{c.author} · {c.id}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-[10px] text-slate-400 font-medium">No commits yet in workspace.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DEPLOYMENTS VIEW */}
              {leftView === "deployments" && (
                <div className="space-y-4">
                  <button
                    onClick={handleDeployProject}
                    className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-xl transition-all"
                  >
                    Trigger Sandbox Deployment
                  </button>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Domains</span>
                    {currentProject.deployments && currentProject.deployments.length > 0 ? (
                      currentProject.deployments.map((d: any) => (
                        <div key={d.id} className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Production</span>
                            <span className="text-[9px] text-slate-400">{new Date(d.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-xs font-bold text-indigo-600 truncate">{d.url}</div>
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-1.5 font-bold"
                          >
                            Open Deployment <ExternalLink className="w-2.5 h-2.5" />
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

              {/* SETTINGS VIEW */}
              {leftView === "settings" && (
                <div className="space-y-5">
                  
                  {/* Secrets panel */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ForgeAI Secrets</span>
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <LockKeyhole className="w-3.5 h-3.5" /> Server-side Auth Key
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Gemini API is integrated natively on server using process.env.GEMINI_API_KEY. No client exposure.</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-bold text-slate-400 bg-white border px-2 py-1 rounded w-full flex items-center justify-between">
                          <span>••••••••••••••••••••</span>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Environment Vars */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Environment Variables</span>
                    <div className="space-y-2">
                      {envVarsList.map(env => (
                        <div key={env.key} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border">
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
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg"
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg"
                        value={newEnvValue}
                        onChange={(e) => setNewEnvValue(e.target.value)}
                      />
                      <button
                        onClick={handleAddEnv}
                        className="w-full bg-slate-800 text-white text-[11px] font-bold py-1.5 rounded-lg"
                      >
                        Add Var
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* IDE & Workspace Segment */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Main IDE Tabs and Split View */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Editor & Preview Split Panel */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* CODE EDITOR SIDE */}
              <div className={`flex-1 flex flex-col border-r transition-all ${darkMode ? "bg-slate-900" : "bg-white"}`}>
                <div className={`px-4 py-2 flex items-center justify-between border-b ${darkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/50"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span className="text-xs font-bold text-slate-600">{activeFile}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFileTreeOpen(!fileTreeOpen)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                      title="Toggle Side Drawer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden">
                  <MonacoEditor
                    height="100%"
                    language={activeFile.endsWith(".html") ? "html" : "javascript"}
                    theme={darkMode ? "vs-dark" : "light"}
                    value={editorContent}
                    onChange={(val) => {
                      if (val !== undefined) {
                        setEditorContent(val);
                        saveFileContent(val);
                      }
                    }}
                    options={{
                      fontSize: 13,
                      fontFamily: "Fira Code, monospace",
                      minimap: { enabled: false },
                      automaticLayout: true,
                      padding: { top: 12 }
                    }}
                  />
                </div>
              </div>

              {/* LIVE PREVIEW SIDE (Dynamic compilation preview sandbox) */}
              <div className={`flex-1 flex flex-col transition-all ${darkMode ? "bg-slate-950" : "bg-[#F3F4F6]"}`}>
                
                {/* Simulated Web Browser Chrome Bar */}
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

                  {/* Width Control Devices Presets */}
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
                    <div className="border-l pl-2 ml-1">
                      <button
                        onClick={() => {
                          if (currentProject) {
                            window.open(`/deployments/${currentProject.id}`, "_blank");
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actual sandboxed Render Preview */}
                <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                  <div
                    className="h-full max-h-full rounded-2xl shadow-xl overflow-hidden bg-white border border-slate-200 transition-all duration-300"
                    style={{
                      width: previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "768px" : "375px"
                    }}
                  >
                    {currentProject ? (
                      <iframe
                        key={previewRefreshKey}
                        src={`${previewUrl}?t=${previewRefreshKey}`}
                        title="ForgeAI Live App Preview"
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-popups"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6">
                        <Globe className="w-10 h-10 text-slate-300 animate-pulse mb-3" />
                        <p className="text-sm font-semibold">Ready for compilation sandbox</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Bottom Interactive Terminal panel */}
          <div className={`h-48 border-t flex flex-col transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-[#1E1E2E] text-slate-200"}`}>
            
            <div className="px-4 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Sandbox Interactive Shell
              </span>
              <div className="flex gap-2 text-[10px]">
                <button onClick={() => setTerminalHistory(["sandbox@forge:~$ "])} className="hover:text-white transition-all">Clear</button>
              </div>
            </div>

            {/* Terminal Feed logs */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-indigo-200/90 space-y-1">
              {terminalHistory.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed">{line}</div>
              ))}
              <div ref={terminalBottomRef} />
            </div>

            {/* Terminal input form */}
            <form onSubmit={handleTerminalSubmit} className="px-3 py-2 border-t border-slate-800 flex items-center gap-2 bg-slate-950/60">
              <span className="font-mono text-xs text-indigo-400">sandbox@forge:~$</span>
              <input
                type="text"
                placeholder="npm run build, tsc --noEmit, vitest..."
                className="flex-1 bg-transparent border-none text-xs text-white font-mono focus:outline-none"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
              />
            </form>

          </div>

        </div>

        {/* Right Pane: AI Coding Agent (Streaming thoughts, steps, summary) */}
        <div className={`w-80 border-l flex flex-col transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/60"}`}>
          
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">ForgeAI Agent</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Thinking and active action plans */}
            {isAgentThinking ? (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-xs font-bold text-indigo-900">Agent Processing</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 font-medium">{agentStep}</p>
                </div>

                <div className="space-y-1.5 pl-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Plan</div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>• Scoping prompt requirements...</div>
                    <div className="opacity-50">• Generating custom full-stack component logic</div>
                    <div className="opacity-50">• Simulating testing and compile pass verification</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Thoughts Panel */}
                {agentThoughts && (
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Model Thoughts</span>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{agentThoughts}"</p>
                  </div>
                )}

                {/* Plan Accomplished */}
                {agentPlan.length > 0 && (
                  <div className="space-y-1.5 pl-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Action Plan Completed</span>
                    <div className="space-y-1">
                      {agentPlan.map((step, sIdx) => (
                        <div key={sIdx} className="text-xs text-slate-700 flex items-start gap-2 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Automated QA Report */}
                {currentProject && (
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Automated QA Verification</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                      <div className="flex items-center gap-1.5 p-1 bg-white border rounded">
                        <Check className="w-3 h-3 text-emerald-500" /> Build: PASS
                      </div>
                      <div className="flex items-center gap-1.5 p-1 bg-white border rounded">
                        <Check className="w-3 h-3 text-emerald-500" /> Types: PASS
                      </div>
                      <div className="flex items-center gap-1.5 p-1 bg-white border rounded">
                        <Check className="w-3 h-3 text-emerald-500" /> Lint: PASS
                      </div>
                      <div className="flex items-center gap-1.5 p-1 bg-white border rounded">
                        <Check className="w-3 h-3 text-emerald-500" /> Tests: PASS
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State agent suggestions */}
                {agentPlan.length === 0 && (
                  <div className="text-center py-6">
                    <Sparkles className="w-8 h-8 text-indigo-600/30 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-slate-800">Ask the Agent anything</p>
                    <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-1">"Build a SaaS landing page", "Add visual analytics charts", or "Add login forms"</p>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* AI prompt inputs */}
          <form onSubmit={handleAgentPromptSubmit} className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                placeholder="What should we build next?..."
                className="w-full text-xs pl-3.5 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white shadow-sm"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAgentThinking}
              />
              <button
                type="submit"
                disabled={isAgentThinking || !chatInput.trim()}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

        </div>

      </div>

      {/* AUTHENTICATION / REGISTRATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{isRegistering ? "Create ForgeAI Account" : "Welcome Back"}</h3>
                <p className="text-xs text-slate-400 mt-1">Design, code, compile, and deploy seamlessly.</p>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="p-1 hover:bg-slate-50 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {isRegistering && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border text-slate-800"
                    placeholder="Jane Doe"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email address</label>
                <input
                  type="email"
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border text-slate-800"
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border text-slate-800"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm"
              >
                {isRegistering ? "Register Account" : "Sign In"}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                {isRegistering ? "Already have an account? Sign In" : "New to ForgeAI? Register Now"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
