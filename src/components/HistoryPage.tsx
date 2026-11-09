import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, RefreshCw, Trash2, ArrowUpRight, AlertCircle, ShieldCheck, Clock, Check, LogIn } from 'lucide-react';
import { PasswordHistoryItem, GeneratorOptions } from '../lib/types';
import { supabase, formatSupabaseError, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface HistoryPageProps {
  onRegenerate: (options: GeneratorOptions) => void;
  onNavigateToAuth: () => void;
  onNavigateToGenerator: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onRegenerate,
  onNavigateToAuth,
  onNavigateToGenerator,
}) => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<PasswordHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Fetch history from Supabase
  const fetchHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY) are not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query the existing table password_history
      const { data, error: selectError } = await supabase
        .from('password_history')
        .select('id, user_id, label, length, use_upper, use_lower, use_numbers, use_symbols, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (selectError) {
        setError(`Supabase Error: ${formatSupabaseError(selectError)}`);
      } else {
        setHistoryItems(data || []);
      }
    } catch (err) {
      setError(`Supabase Error: ${formatSupabaseError(err)}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Delete an entry from password_history table
  const handleDelete = async (id: string, label: string) => {
    if (!user) return;
    setDeletingId(id);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('password_history')
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(`Supabase Delete Failed: ${formatSupabaseError(deleteError)}`);
      } else {
        setHistoryItems(prev => prev.filter(item => item.id !== id));
        setDeleteSuccessMsg(`Deleted recipe "${label}" from audit history.`);
        setTimeout(() => setDeleteSuccessMsg(null), 3000);
      }
    } catch (err) {
      setError(`Supabase Delete Failed: ${formatSupabaseError(err)}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Trigger regeneration with saved recipe options
  const handleLoadRecipe = (item: PasswordHistoryItem) => {
    onRegenerate({
      length: item.length,
      useUpper: item.use_upper,
      useLower: item.use_lower,
      useNumbers: item.use_numbers,
      useSymbols: item.use_symbols,
      excludeLookAlike: false,
    });
  };

  // Filter items by label search
  const filteredItems = historyItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#818cf8] tracking-wider uppercase">
            <History className="w-3.5 h-3.5" />
            <span>Audit History Table · Supabase</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Password Generation Recipes
          </h1>
          <p className="text-xs sm:text-sm text-[#908fa0] mt-1">
            Archived recipes from <code className="text-[#818cf8] font-mono">password_history</code>. Passwords themselves are never recorded.
          </p>
        </div>

        {user && (
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-[#818cf8] hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Table</span>
          </button>
        )}
      </div>

      {/* Zero-Knowledge Guarantee Banner */}
      <div className="p-3.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/25 flex items-start gap-3 text-xs text-[#dfe2f1]">
        <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#4edea3] font-semibold">Zero-Knowledge Compliance:</strong> In accordance with industry cryptographic standards, SecurePass never logs, transmits, or persists actual passwords. Only policy recipes (length, character classes, timestamps) are stored in your Supabase database.
        </div>
      </div>

      {/* Supabase Error Callout */}
      {error && (
        <div className="p-4 rounded-xl bg-[#f43f5e]/15 border border-[#f43f5e]/35 flex items-start gap-3 text-xs text-[#ffdad6]">
          <AlertCircle className="w-5 h-5 text-[#f43f5e] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white block font-semibold">Supabase Operation Failed</strong>
            <p className="font-mono text-[11px] break-all leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Delete Success Alert */}
      {deleteSuccessMsg && (
        <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center gap-2 text-xs text-[#4edea3]">
          <Check className="w-4 h-4 text-[#10b981] shrink-0" />
          <span>{deleteSuccessMsg}</span>
        </div>
      )}

      {/* If Not Signed In */}
      {!user && (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-4 border border-white/5 my-8">
          <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#818cf8] flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white">Sign In to Access Your History</h2>
            <p className="text-xs text-[#908fa0] leading-relaxed">
              Your audit history is tied to your Supabase account. Sign in or register to sync password generation recipes across devices.
            </p>
          </div>
          <button
            onClick={onNavigateToAuth}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:opacity-90 shadow-lg shadow-[#6366f1]/30 transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Signed In View */}
      {user && (
        <div className="space-y-4">
          {/* Search bar and counter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#908fa0]" />
              <input
                type="text"
                placeholder="Search recipes by label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl recessed-well text-xs text-white placeholder-[#908fa0] focus:outline-none focus:border-[#818cf8] transition-colors"
              />
            </div>

            <div className="text-xs text-[#908fa0] font-mono self-end sm:self-center">
              {filteredItems.length} {filteredItems.length === 1 ? 'recipe' : 'recipes'} recorded
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((skeleton) => (
                <div
                  key={skeleton}
                  className="glass-panel rounded-xl p-4 border border-white/5 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-white/10 rounded w-1/4"></div>
                  <div className="h-3 bg-white/5 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredItems.length === 0 && (
            <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center space-y-4 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#908fa0]">
                <History className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h2 className="text-sm font-semibold text-white">
                  {searchQuery ? 'No matching recipes found' : 'No recipes archived yet'}
                </h2>
                <p className="text-xs text-[#908fa0]">
                  {searchQuery
                    ? `No recipes match "${searchQuery}". Try a different label keyword.`
                    : 'Generate a password and click "Save Recipe" to archive its audit configuration in Supabase.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={onNavigateToGenerator}
                  className="px-5 py-2 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#6366f1]/25 cursor-pointer"
                >
                  Generate Password Now
                </button>
              )}
            </div>
          )}

          {/* History Item Cards List */}
          {!loading && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel rounded-xl p-4 sm:p-5 border border-white/5 hover:border-[#818cf8]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                        {item.label}
                      </h2>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1e1b4b] text-[#c0c1ff] border border-[#818cf8]/30 font-medium">
                        {item.length} chars
                      </span>
                    </div>

                    {/* Parameter classes */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded font-mono ${
                          item.use_upper
                            ? 'bg-white/10 text-white'
                            : 'bg-white/[0.02] text-[#908fa0] line-through opacity-40'
                        }`}
                      >
                        Uppercase
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono ${
                          item.use_lower
                            ? 'bg-white/10 text-white'
                            : 'bg-white/[0.02] text-[#908fa0] line-through opacity-40'
                        }`}
                      >
                        Lowercase
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono ${
                          item.use_numbers
                            ? 'bg-[#818cf8]/15 text-[#818cf8]'
                            : 'bg-white/[0.02] text-[#908fa0] line-through opacity-40'
                        }`}
                      >
                        Numbers
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono ${
                          item.use_symbols
                            ? 'bg-[#10b981]/15 text-[#10b981]'
                            : 'bg-white/[0.02] text-[#908fa0] line-through opacity-40'
                        }`}
                      >
                        Symbols
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#908fa0] font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleLoadRecipe(item)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6366f1]/20 hover:bg-[#6366f1] text-[#c0c1ff] hover:text-white border border-[#6366f1]/40 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm"
                      title="Load this recipe into generator and generate a fresh password"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.label)}
                      disabled={deletingId === item.id}
                      className="p-2 rounded-lg bg-white/5 hover:bg-[#f43f5e]/20 text-[#908fa0] hover:text-[#f43f5e] border border-white/5 transition-all cursor-pointer disabled:opacity-50"
                      title="Delete recipe from history"
                      aria-label="Delete recipe from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
