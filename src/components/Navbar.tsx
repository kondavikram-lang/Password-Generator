import React from 'react';
import { Shield, History, Sliders, LogOut, LogIn, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageView } from '../lib/types';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onOpenConfig: () => void;
  historyCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenConfig,
  historyCount = 0,
}) => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#818cf8]/20 bg-[#0b0f19]/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('generator')}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#1e1b4b] border border-[#818cf8]/40 flex items-center justify-center text-white shadow-md shadow-[#6366f1]/25 group-hover:border-[#c0c1ff] transition-all">
            <Shield className="w-5 h-5 text-[#c0c1ff]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            SecurePass
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onNavigate('generator')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              currentPage === 'generator'
                ? 'text-[#c0c1ff] border-[#6366f1] font-semibold'
                : 'text-[#908fa0] border-transparent hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Generator</span>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              currentPage === 'history'
                ? 'text-[#c0c1ff] border-[#6366f1] font-semibold'
                : 'text-[#908fa0] border-transparent hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit History</span>
            {historyCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenConfig}
            className="hidden md:flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[#908fa0] hover:text-[#818cf8] transition-colors py-1"
            title="Supabase Connection & Zero-Knowledge Architecture"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="text-xs">
              {isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Setup'}
            </span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline-block text-xs font-mono text-[#908fa0] truncate max-w-[150px]">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#f43f5e] bg-[#f43f5e]/10 border border-[#f43f5e]/25 hover:bg-[#f43f5e]/20 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                title="Sign out of Supabase"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage === 'auth'
                  ? 'bg-[#1e1b4b] text-[#c0c1ff] border border-[#818cf8]/40'
                  : 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#4f46e5] hover:to-[#6366f1] text-white shadow-md shadow-[#6366f1]/30'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
