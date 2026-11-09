import React from 'react';
import { ShieldAlert, CheckCircle2, Copy, Check, X, KeyRound, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [copiedSql, setCopiedSql] = React.useState(false);

  if (!isOpen) return null;

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const hasKey = Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

  const sqlSchema = `-- Existing table schema used by SecurePass:
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  length INTEGER NOT NULL,
  use_upper BOOLEAN NOT NULL DEFAULT true,
  use_lower BOOLEAN NOT NULL DEFAULT true,
  use_numbers BOOLEAN NOT NULL DEFAULT true,
  use_symbols BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security policies
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can query their own history" 
ON public.password_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history" 
ON public.password_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history" 
ON public.password_history FOR DELETE 
USING (auth.uid() = user_id);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-[#6366f1]/40 text-[#dfe2f1] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#908fa0] hover:text-white transition-colors rounded-lg hover:bg-white/10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#818cf8]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Supabase Configuration & Security</h2>
            <p className="text-xs text-[#908fa0]">Read from import.meta.env · Zero-knowledge storage guarantee</p>
          </div>
        </div>

        {/* Current status indicators */}
        <div className="mb-6 p-4 rounded-xl recessed-well space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-[#908fa0] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#818cf8]" />
              VITE_SUPABASE_URL
            </span>
            <span className="font-mono text-xs">
              {envUrl ? (
                <span className="text-[#10b981] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Detected ({envUrl.substring(0, 24)}...)
                </span>
              ) : (
                <span className="text-[#f43f5e] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Not Set
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-[#908fa0] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#818cf8]" />
              VITE_SUPABASE_PUBLISHABLE_KEY
            </span>
            <span className="font-mono text-xs">
              {hasKey ? (
                <span className="text-[#10b981] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
              ) : (
                <span className="text-[#f43f5e] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Not Set
                </span>
              )}
            </span>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#908fa0]">Integration Status:</span>
            <span className={`font-semibold ${isSupabaseConfigured ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
              {isSupabaseConfigured ? 'Operational & Ready' : 'Pending Environment Variables'}
            </span>
          </div>
        </div>

        {/* Zero-knowledge policy callout */}
        <div className="mb-6 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
            <div className="text-xs text-[#dfe2f1] leading-relaxed">
              <strong className="text-[#4edea3] block mb-1">Zero-Knowledge Architecture Enforced</strong>
              SecurePass generates passwords exclusively in client memory using <code className="text-[#818cf8] font-mono">crypto.getRandomValues</code>.
              The generated password string is <strong>NEVER transmitted or stored</strong> in the database or localStorage.
              Only generation parameters (<code className="text-[#818cf8] font-mono">length, use_upper, use_lower, use_numbers, use_symbols</code>) and your audit label are preserved in the history table.
            </div>
          </div>
        </div>

        {/* Existing table schema reminder */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#818cf8] uppercase tracking-wider">
              Existing Supabase Table Schema (<code className="font-mono text-white">password_history</code>)
            </span>
            <button
              onClick={copySql}
              className="flex items-center gap-1 text-xs text-[#818cf8] hover:text-white px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSql ? 'Copied' : 'Copy SQL'}
            </button>
          </div>
          <pre className="recessed-well p-3 rounded-lg text-[11px] font-mono text-[#c7c4d7] overflow-x-auto max-h-48 border border-white/5 leading-snug">
            {sqlSchema}
          </pre>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-[#6366f1]/30"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
