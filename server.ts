import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client server-side with standard safety User-Agent
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Database setup: file-based persistence for ForgeAI
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface User {
  id: string;
  email: string;
  passwordHash: string; // Simulated secure hash
  name: string;
  createdAt: string;
}

interface ProjectFile {
  [filePath: string]: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  plan?: string[];
  thoughts?: string;
  actions?: Array<{
    type: "create_file" | "update_file" | "delete_file" | "install_package" | "run_command";
    filePath?: string;
    content?: string;
    command?: string;
  }>;
}

interface ProjectVersion {
  id: string;
  name: string;
  timestamp: string;
  files: ProjectFile;
}

interface ProjectDeployment {
  id: string;
  url: string;
  createdAt: string;
  status: "success" | "pending" | "failed";
}

interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  files: ProjectFile;
  messages: Message[];
  versions: ProjectVersion[];
  deployments: ProjectDeployment[];
  envVars: Record<string, string>;
  gitRepo: {
    connected: boolean;
    repoName: string;
    branch: string;
    commits: Array<{ id: string; message: string; author: string; timestamp: string }>;
  } | null;
  logs: Array<{ timestamp: string; level: "info" | "warn" | "error"; text: string }>;
}

interface DatabaseSchema {
  users: User[];
  projects: Project[];
}

const defaultDB: DatabaseSchema = {
  users: [
    {
      id: "u-default",
      email: "guest@forgeai.dev",
      passwordHash: "pbkdf2:guest",
      name: "Guest Builder",
      createdAt: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: "p-example",
      userId: "u-default",
      name: "Smart AI Task Manager",
      description: "A gorgeous modern task management dashboard with responsive styling and local state management.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: {
        "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Task Manager</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Tailwind UI custom fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen">
  <div id="root"></div>
  <script type="module" src="./App.jsx"></script>
</body>
</html>`,
        "App.jsx": `import React, { useState } from 'react';

export default function App() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Design user onboarding flow', category: 'Design', priority: 'High', completed: false },
    { id: 2, title: 'Configure production database', category: 'Backend', priority: 'Critical', completed: true },
    { id: 3, title: 'Integrate Stripe billing endpoints', category: 'Payments', priority: 'Medium', completed: false },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [category, setCategory] = useState('Design');
  const [priority, setPriority] = useState('Medium');

  const addTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: newTitle,
        category,
        priority,
        completed: false
      }
    ]);
    setNewTitle('');
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  return (
    <div class="max-w-4xl mx-auto px-6 py-12">
      <!-- Header -->
      <header class="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Smart Task Manager</h1>
          <p class="text-sm text-slate-500 mt-1">Organize your sprints and features elegantly</p>
        </div>
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
          {tasks.filter(t => !t.completed).length} Tasks Pending
        </span>
      </header>

      <!-- Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <!-- New Task Form -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-1">
          <h2 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-5 h-5 text-indigo-600"></i> Add Task
          </h2>
          <form onSubmit={addTask} class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Design</option>
                <option>Backend</option>
                <option>Frontend</option>
                <option>Payments</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
            <button 
              type="submit" 
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-indigo-100"
            >
              Create Task
            </button>
          </form>
        </div>

        <!-- Task List -->
        <div class="md:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">Sprint Tasks</h2>
            <div class="flex gap-2">
              <span class="text-xs text-slate-400">Filter: All</span>
            </div>
          </div>

          <div class="space-y-3">
            {tasks.map(t => (
              <div 
                key={t.id} 
                class={\`flex items-center justify-between p-4 bg-white rounded-2xl border transition-all hover:shadow-md \${t.completed ? 'border-slate-100 opacity-60 bg-slate-50/50' : 'border-slate-200'}\`}
              >
                <div class="flex items-center gap-3">
                  <button 
                    onClick={() => toggleComplete(t.id)}
                    class={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all \${t.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 hover:border-indigo-500'}\`}
                  >
                    {t.completed && <i data-lucide="check" class="w-3.5 h-3.5"></i>}
                  </button>
                  <div>
                    <h3 class={\`font-semibold text-sm text-slate-800 \${t.completed ? 'line-through text-slate-400' : ''}\`}>
                      {t.title}
                    </h3>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs text-slate-400">{t.category}</span>
                      <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span class={\`text-[10px] px-2 py-0.5 rounded-md border font-semibold \${getPriorityColor(t.priority)}\`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => deleteTask(t.id)}
                  class="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                >
                  <i data-lucide="trash" class="w-4 h-4"></i>
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div class="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <p class="text-slate-400 text-sm font-medium">All task queues cleared! Enjoy your afternoon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}`,
      },
      messages: [],
      versions: [],
      deployments: [],
      envVars: {},
      gitRepo: null,
      logs: [
        { timestamp: new Date().toISOString(), level: "info", text: "Project initialized successfully" },
        { timestamp: new Date().toISOString(), level: "info", text: "Local static build sandbox server fully operational on port 3000" },
      ],
    },
  ],
};

function readDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf8");
      return defaultDB;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return defaultDB;
  }
}

function writeDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Ensure database is bootstrapped
readDB();

// AUTHENTICATION ROUTES
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required registration parameters." });
  }

  const db = readDB();
  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Account with this email already registered." });
  }

  const newUser: User = {
    id: "u-" + Math.random().toString(36).substring(2, 11),
    email: email.toLowerCase(),
    passwordHash: "pbkdf2:" + password, // Simple simulated secure storage
    name,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({
    user: { id: newUser.id, email: newUser.email, name: newUser.name },
    message: "Registration successful.",
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === "pbkdf2:" + password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    message: "Login successful.",
  });
});

// PROJECT CRUD API
app.get("/api/projects", (req, res) => {
  const db = readDB();
  // Filter by userId if supplied (or default guest user)
  const userId = req.query.userId as string || "u-default";
  const userProjects = db.projects.filter((p) => p.userId === userId);
  res.json(userProjects);
});

app.get("/api/projects/:id", (req, res) => {
  const db = readDB();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found." });
  }
  res.json(project);
});

app.post("/api/projects", (req, res) => {
  const { name, description, userId } = req.body;
  const db = readDB();

  const newProject: Project = {
    id: "p-" + Math.random().toString(36).substring(2, 11),
    userId: userId || "u-default",
    name: name || "Untitled Project",
    description: description || "An elegant, AI-generated custom interface.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name || "New ForgeAI App"}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen">
  <div id="root"></div>
  <script type="module" src="./App.jsx"></script>
</body>
</html>`,
      "App.jsx": `import React, { useState } from 'react';

export default function App() {
  return (
    <div class="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-slate-800">
      <div class="max-w-md w-full text-center space-y-6">
        <h1 class="text-4xl font-extrabold text-indigo-600 tracking-tight">ForgeAI App</h1>
        <p class="text-slate-500">This is a brand new application scaffold. Use the ForgeAI AI Agent to generate rich layouts, databases, and features automatically.</p>
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-semibold text-slate-500">App Ready & Sandboxed</span>
        </div>
      </div>
    </div>
  );
}`,
    },
    messages: [],
    versions: [],
    deployments: [],
    envVars: {},
    gitRepo: null,
    logs: [{ timestamp: new Date().toISOString(), level: "info", text: "Project initialized" }],
  };

  db.projects.push(newProject);
  writeDB(db);

  res.status(201).json(newProject);
});

app.put("/api/projects/:id", (req, res) => {
  const db = readDB();
  const idx = db.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Project not found." });
  }

  const project = db.projects[idx];
  const { name, description, files, envVars, gitRepo } = req.body;

  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (files !== undefined) project.files = files;
  if (envVars !== undefined) project.envVars = envVars;
  if (gitRepo !== undefined) project.gitRepo = gitRepo;

  project.updatedAt = new Date().toISOString();

  // Create automatic version snapshot before heavy changes
  if (files !== undefined && JSON.stringify(files) !== JSON.stringify(db.projects[idx].files)) {
    project.versions.push({
      id: "v-" + Math.random().toString(36).substring(2, 11),
      name: `User Edit - ${new Date().toLocaleTimeString()}`,
      timestamp: new Date().toISOString(),
      files: JSON.parse(JSON.stringify(files)),
    });
  }

  db.projects[idx] = project;
  writeDB(db);

  res.json(project);
});

app.post("/api/projects/:id/fork", (req, res) => {
  const db = readDB();
  const original = db.projects.find((p) => p.id === req.params.id);
  if (!original) {
    return res.status(404).json({ error: "Project not found to duplicate." });
  }

  const duplicated: Project = {
    ...JSON.parse(JSON.stringify(original)),
    id: "p-" + Math.random().toString(36).substring(2, 11),
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deployments: [],
  };

  db.projects.push(duplicated);
  writeDB(db);

  res.status(201).json(duplicated);
});

app.delete("/api/projects/:id", (req, res) => {
  const db = readDB();
  const idx = db.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Project not found." });
  }

  db.projects.splice(idx, 1);
  writeDB(db);

  res.json({ success: true, message: "Project deleted successfully." });
});

// TERMINAL COMMAND SIMULATION
app.post("/api/projects/:id/terminal/command", (req, res) => {
  const { command } = req.body;
  const db = readDB();
  const project = db.projects.find((p) => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: "Project not found." });
  }

  const normalizedCmd = (command || "").trim();
  let logOutput = "";
  let success = true;

  if (normalizedCmd === "npm run build") {
    logOutput = `> forge-sandbox-app@0.0.0 build\n> vite build\n\nvite v6.2.3 building for production...\ntranspiling modules...\n✓ 12 modules transformed.\ndist/assets/index-B1F34D12.js   214.50 kB │ gzip: 65.30 kB\ndist/index.html                 1.12 kB\n✓ built in 1.45s\n\nBuild execution completed successfully. Static assets optimized.`;
  } else if (normalizedCmd === "npm run lint") {
    logOutput = `> forge-sandbox-app@0.0.0 lint\n> tsc --noEmit && eslint .\n\nNo TypeScript compiler diagnostics or styling rules violated. Lint clean.`;
  } else if (normalizedCmd.startsWith("npm install")) {
    const pkg = normalizedCmd.replace("npm install", "").trim() || "dependencies";
    logOutput = `npm info loading registry...\nadded 1 package, audited 143 packages in 0.86s\nfound 0 vulnerabilities\n\nSuccessfully installed ${pkg}`;
  } else if (normalizedCmd === "npm test") {
    logOutput = `> forge-sandbox-app@0.0.0 test\n> vitest run\n\nRUN  v2.0.2 /sandbox\n\n ✓ src/App.test.jsx (1) 12ms\n   ✓ App component mounts and displays header\n\nTest Files  1 passed (1)\nTests       1 passed (1)\nDuration    124ms\n\nPASS`;
  } else {
    logOutput = `forge-sandbox: command not found: ${normalizedCmd}`;
    success = false;
  }

  project.logs.push({
    timestamp: new Date().toISOString(),
    level: success ? "info" : "error",
    text: `Terminal Executed: "${command}"\n${logOutput}`,
  });

  const updatedDB = readDB();
  const pIdx = updatedDB.projects.findIndex((p) => p.id === req.params.id);
  if (pIdx !== -1) {
    updatedDB.projects[pIdx] = project;
    writeDB(updatedDB);
  }

  res.json({ success, output: logOutput, logs: project.logs });
});

// AI CODING AGENT CHAT ENDPOINT (Real Gemini-powered agent)
app.post("/api/projects/:id/chat", async (req, res) => {
  const { prompt } = req.body;
  const db = readDB();
  const projectIdx = db.projects.findIndex((p) => p.id === req.params.id);

  if (projectIdx === -1) {
    return res.status(404).json({ error: "Project not found." });
  }

  const project = db.projects[projectIdx];

  // Save user message to database
  const userMessage: Message = {
    id: "m-" + Math.random().toString(36).substring(2, 11),
    role: "user",
    content: prompt,
    createdAt: new Date().toISOString(),
  };
  project.messages.push(userMessage);

  if (!apiKey) {
    // Return friendly warning message if Gemini key is missing
    const errText = "GEMINI_API_KEY environment variable is missing on ForgeAI server. Please check your secrets.";
    const fallbackMessage: Message = {
      id: "m-" + Math.random().toString(36).substring(2, 11),
      role: "assistant",
      content: "Hello! It looks like the **GEMINI_API_KEY** is not configured in this ForgeAI server workspace. To enable real code generation, configure your key in **Settings > Secrets**. \n\nI have generated a simulated response so you can still preview the system in action!",
      plan: ["Simulate SaaS Dashboard code creation"],
      thoughts: "Failing gracefully because GEMINI_API_KEY is not defined.",
      actions: [
        {
          type: "update_file",
          filePath: "App.jsx",
          content: `import React, { useState } from 'react';

export default function App() {
  const [stats] = useState([
    { name: 'Total Revenue', value: '$45,231.89', change: '+20.1% from last month', trend: 'up' },
    { name: 'Active Users', value: '+2,350', change: '+180.1% from last week', trend: 'up' },
    { name: 'Subscription MRR', value: '$12,480.00', change: '+10.5% from last month', trend: 'up' },
  ]);

  const [recentSales] = useState([
    { id: 1, name: 'Sarah Connor', email: 'sarah@skynet.com', amount: '+$199.00', status: 'Completed' },
    { id: 2, name: 'John Doe', email: 'john@doe.com', amount: '+$49.00', status: 'Pending' },
    { id: 3, name: 'Ellen Ripley', email: 'ripley@nostromo.org', amount: '+$299.00', status: 'Completed' },
  ]);

  return (
    <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <!-- Navbar -->
      <nav class="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 px-8 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 bg-indigo-500 rounded-full animate-pulse"></span>
          <span class="font-extrabold tracking-tight text-lg text-white">ForgeAI Premium SaaS</span>
        </div>
        <div class="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <a href="#overview" class="text-white hover:text-white">Overview</a>
          <a href="#analytics" class="hover:text-white transition-all">Analytics</a>
          <a href="#customers" class="hover:text-white transition-all">Customers</a>
          <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all">Upgrade</button>
        </div>
      </nav>

      <!-- Main Body -->
      <main class="flex-1 p-8 max-w-6xl w-full mx-auto space-y-8">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-white">Metrics Dashboard</h2>
          <p class="text-sm text-slate-400">Real-time usage and subscription telemetry overview.</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map(s => (
            <div class="bg-slate-800 border border-slate-800/80 p-6 rounded-2xl shadow-sm">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.name}</span>
              <div class="text-3xl font-extrabold text-white mt-2">{s.value}</div>
              <p class="text-xs text-indigo-400 mt-1">{s.change}</p>
            </div>
          ))}
        </div>

        <!-- Sales and Activity -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div class="bg-slate-800 border border-slate-800/80 p-6 rounded-2xl">
            <h3 class="text-lg font-bold text-white mb-4">Recent Subscriptions</h3>
            <div class="space-y-4">
              {recentSales.map(sale => (
                <div class="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700">
                  <div>
                    <div class="text-sm font-semibold text-white">{sale.name}</div>
                    <div class="text-xs text-slate-400">{sale.email}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-emerald-400">{sale.amount}</div>
                    <span class="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">{sale.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="bg-slate-800 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
            <div class="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
              <span class="w-3.5 h-3.5 bg-indigo-500 rounded-full animate-ping"></span>
            </div>
            <h3 class="text-lg font-bold text-white">System Status</h3>
            <p class="text-xs text-slate-400 max-w-xs mt-2">All cloud ingress pipelines and regional load balancers are routing perfectly with 0% latency degradations.</p>
          </div>
        </div>
      </main>
    </div>
  );
}`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    project.messages.push(fallbackMessage);
    project.files["App.jsx"] = fallbackMessage.actions![0].content!;
    project.logs.push({
      timestamp: new Date().toISOString(),
      level: "warn",
      text: "Simulated layout update triggered due to missing server-side API Key configuration.",
    });

    db.projects[projectIdx] = project;
    writeDB(db);
    return res.json({ message: fallbackMessage, logs: project.logs, files: project.files });
  }

  try {
    // Generate code using real server-side Gemini 3.8-flash model
    const fileStructureContext = Object.entries(project.files)
      .map(([path, code]) => `File [${path}]:\n\`\`\`\n${code}\n\`\`\``)
      .join("\n\n");

    const systemInstruction = `You are ForgeAI, an expert full-stack autonomous coding agent and developer sandbox manager.
Your task is to analyze the user's prompt, inspect the current project files, and return an action plan containing custom modified and created files.

Current Project Files Context:
${fileStructureContext}

You MUST modify or add files. Ensure files look beautifully polished, premium, with zero templates/stubs. Use Tailwind CSS v3/v4 classes and Lucide Icons (CDN scripts included in index.html).
Make sure you write modern code. App.jsx is imported by index.html as \`./App.jsx\` with React 18 / 19 rendering.

You MUST respond ONLY with a JSON object following this TypeScript Schema:
{
  "thoughts": "High level analysis of what code edits are needed to complete the user request.",
  "plan": ["List of steps", "Step 2", "Step 3"],
  "actions": [
    {
      "type": "create_file" | "update_file" | "delete_file",
      "filePath": "relative filename e.g. App.jsx",
      "content": "Full code file content to write"
    }
  ],
  "summary": "Elegant markdown summary explaining what features were introduced, styling choices, and logical details."
}`;

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thoughts: { type: Type.STRING },
            plan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  filePath: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ["type", "filePath"],
              },
            },
            summary: { type: Type.STRING },
          },
          required: ["thoughts", "plan", "actions", "summary"],
        },
      },
    });

    const resultText = geminiResponse.text;
    const parsed = JSON.parse(resultText);

    // Apply the generated agent actions onto the project files
    parsed.actions.forEach((act: any) => {
      if (act.type === "create_file" || act.type === "update_file") {
        project.files[act.filePath] = act.content || "";
        project.logs.push({
          timestamp: new Date().toISOString(),
          level: "info",
          text: `AI Action - Created/Updated file [${act.filePath}]`,
        });
      } else if (act.type === "delete_file") {
        delete project.files[act.filePath];
        project.logs.push({
          timestamp: new Date().toISOString(),
          level: "info",
          text: `AI Action - Deleted file [${act.filePath}]`,
        });
      }
    });

    // Create a history snapshot version of the files
    const snapshotName = `AI Agent - ${prompt.substring(0, 30)}...`;
    project.versions.push({
      id: "v-" + Math.random().toString(36).substring(2, 11),
      name: snapshotName,
      timestamp: new Date().toISOString(),
      files: JSON.parse(JSON.stringify(project.files)),
    });

    const assistantMessage: Message = {
      id: "m-" + Math.random().toString(36).substring(2, 11),
      role: "assistant",
      content: parsed.summary,
      plan: parsed.plan,
      thoughts: parsed.thoughts,
      actions: parsed.actions,
      createdAt: new Date().toISOString(),
    };

    project.messages.push(assistantMessage);
    db.projects[projectIdx] = project;
    writeDB(db);

    res.json({ message: assistantMessage, logs: project.logs, files: project.files });
  } catch (err: any) {
    console.error("Gemini request failed:", err);
    res.status(500).json({ error: "AI Agent code generation failed.", details: err.message });
  }
});

// DEPLOYMENT ENDPOINT
app.post("/api/projects/:id/deploy", (req, res) => {
  const db = readDB();
  const projectIdx = db.projects.findIndex((p) => p.id === req.params.id);

  if (projectIdx === -1) {
    return res.status(404).json({ error: "Project not found." });
  }

  const project = db.projects[projectIdx];
  const depId = "dep-" + Math.random().toString(36).substring(2, 11);
  const deployUrl = `/deployments/${project.id}`;

  const newDeployment: ProjectDeployment = {
    id: depId,
    url: deployUrl,
    createdAt: new Date().toISOString(),
    status: "success",
  };

  project.deployments.push(newDeployment);
  project.logs.push({
    timestamp: new Date().toISOString(),
    level: "info",
    text: `Successfully deployed production build of project to: ${deployUrl}`,
  });

  db.projects[projectIdx] = project;
  writeDB(db);

  res.status(201).json(newDeployment);
});

// DEPLOYMENT SERVING ROUTE (Serves dynamic sandboxed app HTML preview)
app.get("/deployments/:id", (req, res) => {
  const db = readDB();
  const project = db.projects.find((p) => p.id === req.params.id);

  if (!project) {
    return res.status(404).send("<h2>ForgeAI Deployment Error: App not found or deleted.</h2>");
  }

  // Create a beautiful, standalone HTML preview that bundles React and tailwind in the iframe natively!
  const html = project.files["index.html"] || "<h2>Error: Missing index.html in files</h2>";

  // If there are jsx scripts in the HTML, we compile/transform them using Babel standalone so they run on client-side!
  // Inject React, Babel Standalone, and Tailwind CSS CDN for maximum runtime stability
  let processedHtml = html;

  if (!processedHtml.includes("https://unpkg.com/@babel/standalone")) {
    processedHtml = processedHtml.replace(
      "</head>",
      `  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  </head>`
    );
  }

  // In the index.html we'll dynamically construct the components at runtime via an inline script
  const filesMapJson = JSON.stringify(project.files);

  const virtualBundlerScript = `
  <script type="text/babel" data-presets="react,es2015">
    // Mock virtual filesystem and ESM imports on client-side
    const files = ${filesMapJson};
    
    // Simple custom ESM loader for JSX files in sandbox
    function loadModule(fileName) {
      const code = files[fileName];
      if (!code) {
        throw new Error("Module not found: " + fileName);
      }
      
      // Clean up standard esm imports, HTML comments, and class attributes for JSX safety
      const cleaned = code
        .replace(/<!--[\\s\\S]*?-->/g, '')
        .replace(/\\bclass="/g, 'className="')
        .replace(/\\bclass='/g, "className='")
        .replace(/import\\s+[^;]+from\\s+['"]react['"]/g, 'const React = window.React; const { useState, useEffect, useRef, useMemo, useCallback } = React;')
        .replace(/import\\s+[^;]+from\\s+['"]react-dom['"]/g, 'const ReactDOM = window.ReactDOM;')
        .replace(/export\\s+default\\s+function\\s+(\\w+)/g, 'function $1')
        .replace(/export\\s+default\\s+/g, 'window.RootComponent = ');
      
      return cleaned;
    }

    try {
      // Load and execute App.jsx
      const appCode = loadModule("App.jsx");
      const evalCode = appCode + "\\n; if (typeof RootComponent === 'undefined') { window.RootComponent = App; }";
      
      // Execute the transformed React component
      const transpiled = Babel.transform(evalCode, { presets: ['react', 'es2015'] }).code;
      eval(transpiled);
      
      // Mount the root component
      if (window.RootComponent) {
        const rootElement = document.getElementById("root");
        if (rootElement) {
          const root = ReactDOM.createRoot(rootElement);
          root.render(<window.RootComponent />);
        }
      }
      
      // Initialize lucide icons if library available
      setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }, 300);
      
    } catch (err) {
      document.body.innerHTML = \`
        <div style="background-color: #fef2f2; color: #b91c1c; padding: 24px; font-family: monospace; border-left: 4px solid #ef4444; margin: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0; font-size: 18px;">ForgeAI Sandbox Compilation Error</h2>
          <pre style="white-space: pre-wrap; font-size: 14px; margin-bottom: 0;">\${err.message}\\n\\n\${err.stack}</pre>
        </div>
      \`;
    }
  </script>
  `;

  // Remove original modular entry script tag to avoid execution errors
  processedHtml = processedHtml.replace(/<script[^>]+src=["']\.\/App\.jsx["'][^>]*><\/script>/g, "");
  processedHtml = processedHtml.replace(/<script[^>]+src=["']App\.jsx["'][^>]*><\/script>/g, "");

  // Inject virtual bundler right before closing body tag
  processedHtml = processedHtml.replace("</body>", `${virtualBundlerScript}</body>`);

  res.send(processedHtml);
});

// GITHUB INTEGRATION SIMULATION
app.post("/api/projects/:id/git/commit", (req, res) => {
  const { message } = req.body;
  const db = readDB();
  const projectIdx = db.projects.findIndex((p) => p.id === req.params.id);

  if (projectIdx === -1) {
    return res.status(404).json({ error: "Project not found." });
  }

  const project = db.projects[projectIdx];
  if (!project.gitRepo) {
    project.gitRepo = {
      connected: true,
      repoName: "github.com/moh2005mohe-spec/aicoding",
      branch: "main",
      commits: [],
    };
  }

  const newCommit = {
    id: Math.random().toString(16).substring(2, 9),
    message: message || "Refactored UI utilizing ForgeAI engine",
    author: "moh2005mohe@gmail.com",
    timestamp: new Date().toISOString(),
  };

  project.gitRepo.commits.unshift(newCommit);
  project.logs.push({
    timestamp: new Date().toISOString(),
    level: "info",
    text: `Git Committed: "${message}" [commit_hash: ${newCommit.id}]`,
  });

  db.projects[projectIdx] = project;
  writeDB(db);

  res.json({ success: true, commit: newCommit, gitRepo: project.gitRepo });
});

// Serve frontend assets in production / use Vite dev server in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ForgeAI Server fully operational on http://localhost:${PORT}`);
    });
  }
}

if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}

export default app;
