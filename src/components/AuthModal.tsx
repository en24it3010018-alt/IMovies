import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { api, authStorage } from '../api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register(name, email, password, role);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: 'user' | 'admin') => {
    setError(null);
    setLoading(true);
    const demoEmail = demoRole === 'admin' ? 'admin@imovies.com' : 'user@imovies.com';
    const demoPass = demoRole === 'admin' ? 'admin123' : 'user123';

    try {
      const res = await api.login(demoEmail, demoPass);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl text-left space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-display text-white">IMovies Cinema ID</span>
          </div>
          <p className="text-xs text-slate-400">
            {mode === 'login' ? 'Sign in to access your digital passes & reservations' : 'Create an account to book seats across all theatres'}
          </p>
        </div>

        {/* One-Click Demo Credentials Pill Buttons */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast One-Click Demo Sign In:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('user')}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer text-left truncate"
            >
              👤 Guest (Alex)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-2.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-medium rounded-lg border border-rose-800/60 transition-colors cursor-pointer text-left truncate"
            >
              🛡️ Admin (Operations)
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === 'login' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === 'register' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' && (
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 px-3 rounded-lg border text-left cursor-pointer transition-colors ${
                    role === 'user' ? 'bg-amber-400/10 border-amber-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold block">Cinema Guest</span>
                  <span className="text-[10px] text-slate-400">Book and view passes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-lg border text-left cursor-pointer transition-colors ${
                    role === 'admin' ? 'bg-rose-500/10 border-rose-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold block">Theatre Admin</span>
                  <span className="text-[10px] text-slate-400">Manage shows & movies</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-colors cursor-pointer mt-2"
          >
            {loading ? 'Authenticating...' : (mode === 'login' ? 'Sign In to IMovies' : 'Create My Account')}
          </button>
        </form>
      </div>
    </div>
  );
};
