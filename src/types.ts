export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ProjectFile {
  [filePath: string]: string;
}

export interface MessageAction {
  type: "create_file" | "update_file" | "delete_file" | "install_package" | "run_command";
  filePath?: string;
  content?: string;
  command?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  plan?: string[];
  thoughts?: string;
  actions?: MessageAction[];
}

export interface ProjectVersion {
  id: string;
  name: string;
  timestamp: string;
  files: ProjectFile;
}

export interface ProjectDeployment {
  id: string;
  url: string;
  createdAt: string;
  status: "success" | "pending" | "failed";
}

export interface ProjectLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  text: string;
}

export interface GitCommit {
  id: string;
  message: string;
  author: string;
  timestamp: string;
}

export interface GitRepo {
  connected: boolean;
  repoName: string;
  branch: string;
  commits: GitCommit[];
}

export interface Project {
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
  gitRepo: GitRepo | null;
  logs: ProjectLog[];
}
