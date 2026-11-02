import React from 'react';
import { Film, User as UserIcon, LogOut, ShieldCheck, MapPin } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'now_showing' | 'coming_soon' | 'cinemas' | 'my_tickets' | 'admin';
  setActiveTab: (tab: 'now_showing' | 'coming_soon' | 'cinemas' | 'my_tickets' | 'admin') => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  cities: string[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onQuickSwitchRole: (role: 'user' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  cities,
  onOpenAuth,
  onLogout,
  onQuickSwitchRole
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('now_showing')}
          className="flex items-center gap-2.5 text-left text-white tracking-tight cursor-pointer focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 shadow-md shadow-rose-950/40">
            <Film className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-white whitespace-nowrap">
            IMovies<span className="text-amber-500">.</span>
          </span>
        </button>

        {/* Zone 2: 4–5 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('now_showing')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'now_showing' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-300'
            }`}
          >
            Now Showing
          </button>
          <button
            onClick={() => setActiveTab('coming_soon')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'coming_soon' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-300'
            }`}
          >
            Coming Soon
          </button>
          <button
            onClick={() => setActiveTab('cinemas')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'cinemas' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-300'
            }`}
          >
            Cinemas
          </button>
          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'my_tickets' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-300'
            }`}
          >
            My Tickets
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'admin' ? 'text-rose-400 font-semibold border-b-2 border-rose-400 pb-0.5' : 'text-slate-300 hover:text-rose-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Admin Console</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action / user state with city selector & role toggler */}
        <div className="flex items-center gap-3 shrink-0">
          {/* City selector */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-slate-900 text-slate-200">
                  {city}
                </option>
              ))}
            </select>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-[10px] font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <span className="font-medium text-slate-200 max-w-[90px] md:max-w-[120px] truncate">
                  {currentUser.name}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1 py-0.2 rounded">
                    Admin
                  </span>
                )}
              </div>

              {/* Quick switch button for evaluation testing */}
              <button
                onClick={() => onQuickSwitchRole(currentUser.role === 'admin' ? 'user' : 'admin')}
                title="Switch between User & Admin role"
                className="hidden sm:inline-flex text-[11px] font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2 py-1 rounded-md transition-colors"
              >
                Switch to {currentUser.role === 'admin' ? 'User' : 'Admin'}
              </button>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav links */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 pt-2 mt-2 text-xs font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('now_showing')}
          className={`px-2 py-1 rounded ${activeTab === 'now_showing' ? 'text-amber-400 font-semibold' : ''}`}
        >
          Now Showing
        </button>
        <button
          onClick={() => setActiveTab('coming_soon')}
          className={`px-2 py-1 rounded ${activeTab === 'coming_soon' ? 'text-amber-400 font-semibold' : ''}`}
        >
          Coming Soon
        </button>
        <button
          onClick={() => setActiveTab('cinemas')}
          className={`px-2 py-1 rounded ${activeTab === 'cinemas' ? 'text-amber-400 font-semibold' : ''}`}
        >
          Cinemas
        </button>
        <button
          onClick={() => setActiveTab('my_tickets')}
          className={`px-2 py-1 rounded ${activeTab === 'my_tickets' ? 'text-amber-400 font-semibold' : ''}`}
        >
          Tickets
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2 py-1 rounded text-rose-400 ${activeTab === 'admin' ? 'font-bold' : ''}`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
