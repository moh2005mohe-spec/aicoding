import React from "react";
import { LockKeyhole, X, Mail, User, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  authEmail: string;
  setAuthEmail: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  authName: string;
  setAuthName: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AuthModal({
  show,
  onClose,
  isRegistering,
  setIsRegistering,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authName,
  setAuthName,
  onSubmit
}: AuthModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-6 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-base tracking-tight">
            {isRegistering ? "Create your Developer Workspace" : "Access ForgeAI Workspace"}
          </h3>
          <p className="text-[10px] text-white/70 mt-1">
            {isRegistering ? "Get your own sandboxed database, compiler and git modules" : "Log in to synchronize your active projects and code commits"}
          </p>
        </div>

        {/* Modal Form content */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Developer Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full text-xs pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="developer@forgeai.local"
                className="w-full text-xs pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Security Token Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full text-xs pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-indigo-100"
          >
            {isRegistering ? "Register Developer Account" : "Access sandbox console"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {isRegistering ? "Already have an account? Sign In" : "New to ForgeAI? Create workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
