import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { GeneratorPage } from './components/GeneratorPage';
import { HistoryPage } from './components/HistoryPage';
import { AuthPage } from './components/AuthPage';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { PageView, GeneratorOptions } from './lib/types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { ShieldCheck, Cpu } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageView>('generator');
  const [activeOptions, setActiveOptions] = useState<Partial<GeneratorOptions> | undefined>(undefined);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Sync count of history entries for badge in navbar
  const refreshHistoryCount = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setHistoryCount(0);
      return;
    }
    try {
      const { count, error } = await supabase
        .from('password_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!error && typeof count === 'number') {
        setHistoryCount(count);
      }
    } catch {
      // Ignore count fetch errors silently; detailed errors are displayed in HistoryPage
    }
  }, [user]);

  useEffect(() => {
    refreshHistoryCount();
  }, [refreshHistoryCount]);

  // Handler when user clicks "Regenerate" on a saved recipe in the History page
  const handleRegenerateFromHistory = (options: GeneratorOptions) => {
    setActiveOptions(options);
    setCurrentPage('generator');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-[#dfe2f1]">
      {/* Dynamic ambient radial backdrop */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at 50% -10%, #1e1b4b 0%, #0b0f19 75%)',
        }}
      />

      {/* Top Bar Navigation */}
      <div className="relative z-10">
        <Navbar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenConfig={() => setIsConfigModalOpen(true)}
          historyCount={historyCount}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col">
        {currentPage === 'generator' && (
          <GeneratorPage
            initialOptions={activeOptions}
            onNavigateToHistory={() => setCurrentPage('history')}
            onNavigateToAuth={() => setCurrentPage('auth')}
            onHistoryItemAdded={refreshHistoryCount}
          />
        )}

        {currentPage === 'history' && (
          <HistoryPage
            onRegenerate={handleRegenerateFromHistory}
            onNavigateToAuth={() => setCurrentPage('auth')}
            onNavigateToGenerator={() => setCurrentPage('generator')}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onSuccess={() => {
              setCurrentPage('generator');
              refreshHistoryCount();
            }}
            onNavigateToGenerator={() => setCurrentPage('generator')}
            onOpenConfig={() => setIsConfigModalOpen(true)}
          />
        )}
      </main>

      {/* Quiet, professional footer without spammy badges */}
      <footer className="relative z-10 border-t border-[#818cf8]/15 bg-[#070a10]/80 py-6 text-xs text-[#908fa0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">SecurePass</span>
            <span>·</span>
            <span>Zero-Knowledge Client-Side Cryptographic Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-[#4edea3]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>crypto.getRandomValues</span>
            </span>
            <span>·</span>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Cpu className="w-3 h-3 text-[#818cf8]" />
              <span>Supabase Architecture</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Supabase Schema & Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
