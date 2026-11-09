import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle2, Lock, Mail, ArrowRight, ArrowLeft, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onSuccess: () => void;
  onNavigateToGenerator: () => void;
  onOpenConfig: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccess,
  onNavigateToGenerator,
  onOpenConfig,
}) => {
  const { signIn, signUp, error: authContextError, clearError, isConfigured } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMessage(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUp(email.trim(), password);
        if (res.success) {
          if (res.error) {
            // Confirmation required
            setInfoMessage(res.error);
          } else {
            setInfoMessage('Account successfully created! You are now logged in.');
            setTimeout(() => onSuccess(), 1200);
          }
        } else if (res.error) {
          setLocalError(res.error);
        }
      } else {
        const res = await signIn(email.trim(), password);
        if (res.success) {
          onSuccess();
        } else if (res.error) {
          setLocalError(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const activeError = localError || authContextError;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-16">
      {/* Back button */}
      <button
        onClick={onNavigateToGenerator}
        className="flex items-center gap-1.5 text-xs text-[#908fa0] hover:text-white mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Generator</span>
      </button>

      {/* Auth Card */}
      <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-[#818cf8]/30 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#1e1b4b] border border-[#818cf8]/40 flex items-center justify-center text-white mx-auto shadow-md shadow-[#6366f1]/25">
            <Shield className="w-6 h-6 text-[#c0c1ff]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isSignUp ? 'Create Secure Account' : 'Sign in to SecurePass'}
          </h1>
          <p className="text-xs text-[#908fa0]">
            Supabase authentication with zero-knowledge cryptographic safeguards
          </p>
        </div>

        {/* Supabase status banner if not configured */}
        {!isConfigured && (
          <div className="p-3.5 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-[#f59e0b]">
              <Database className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Supabase Config Alert:</strong> Environment variables <code className="font-mono text-white">VITE_SUPABASE_URL</code> and <code className="font-mono text-white">VITE_SUPABASE_PUBLISHABLE_KEY</code> are not detected in import.meta.env.
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenConfig}
              className="text-[11px] underline text-white hover:text-[#c0c1ff] font-medium block"
            >
              View setup instructions & database schema →
            </button>
          </div>
        )}

        {/* Tab switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl recessed-well">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setLocalError(null);
              setInfoMessage(null);
              clearError();
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/30'
                : 'text-[#908fa0] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setLocalError(null);
              setInfoMessage(null);
              clearError();
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isSignUp
                ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/30'
                : 'text-[#908fa0] hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Exact Supabase Error Alert */}
        {activeError && (
          <div className="p-3.5 rounded-xl bg-[#f43f5e]/15 border border-[#f43f5e]/35 flex items-start gap-2.5 text-xs text-[#ffdad6]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#f43f5e]" />
            <div className="space-y-1">
              <strong className="text-white block font-semibold">Supabase Authentication Error:</strong>
              <div className="font-mono text-[11px] break-all leading-snug">{activeError}</div>
            </div>
          </div>
        )}

        {/* Success / Info Message */}
        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-[#10b981]/15 border border-[#10b981]/35 flex items-start gap-2.5 text-xs text-[#4edea3]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#10b981]" />
            <div>{infoMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#dfe2f1] block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#908fa0] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl recessed-well text-sm text-white placeholder-[#908fa0] focus:outline-none focus:border-[#818cf8] transition-colors"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#dfe2f1] block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#908fa0] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl recessed-well text-sm text-white placeholder-[#908fa0] focus:outline-none focus:border-[#818cf8] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#908fa0] hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl text-xs font-bold tracking-wider text-white bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:opacity-95 shadow-lg shadow-[#6366f1]/35 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <>
                <span>{isSignUp ? 'CREATE SECURE ACCOUNT' : 'AUTHENTICATE'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-[#908fa0]">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setLocalError(null);
                  clearError();
                }}
                className="text-[#818cf8] hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Need a Supabase account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setLocalError(null);
                  clearError();
                }}
                className="text-[#818cf8] hover:underline font-semibold cursor-pointer"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
