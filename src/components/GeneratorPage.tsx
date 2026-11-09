import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, RefreshCw, BookmarkPlus, ShieldCheck, AlertCircle, Info, Sparkles, Key } from 'lucide-react';
import { GeneratorOptions } from '../lib/types';
import { generatePassword, calculateStrength, getCharColorClass } from '../lib/generator';
import { StrengthMeter } from './StrengthMeter';
import { useAuth } from '../context/AuthContext';
import { supabase, formatSupabaseError, isSupabaseConfigured } from '../lib/supabase';

interface GeneratorPageProps {
  initialOptions?: Partial<GeneratorOptions>;
  onNavigateToHistory: () => void;
  onNavigateToAuth: () => void;
  onHistoryItemAdded?: () => void;
}

export const GeneratorPage: React.FC<GeneratorPageProps> = ({
  initialOptions,
  onNavigateToHistory,
  onNavigateToAuth,
  onHistoryItemAdded,
}) => {
  const { user } = useAuth();

  // Generator settings state
  const [options, setOptions] = useState<GeneratorOptions>({
    length: initialOptions?.length ?? 20,
    useUpper: initialOptions?.useUpper ?? true,
    useLower: initialOptions?.useLower ?? true,
    useNumbers: initialOptions?.useNumbers ?? true,
    useSymbols: initialOptions?.useSymbols ?? true,
    excludeLookAlike: initialOptions?.excludeLookAlike ?? false,
  });

  // Current ephemeral password kept strictly in memory state, NEVER saved to storage
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Recipe audit saving state
  const [recipeLabel, setRecipeLabel] = useState<string>('');
  const [isSavingRecipe, setIsSavingRecipe] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync initialOptions if provided (e.g. from History "Regenerate" click)
  useEffect(() => {
    if (initialOptions) {
      setOptions(prev => ({
        ...prev,
        ...initialOptions,
      }));
    }
  }, [initialOptions]);

  // Generate password using crypto.getRandomValues
  const handleGenerate = useCallback(() => {
    setIsRegenerating(true);
    const newPwd = generatePassword(options);
    setPassword(newPwd);
    setCopied(false);
    setTimeout(() => setIsRegenerating(false), 200);
  }, [options]);

  // Auto-generate on first mount and whenever generator options change
  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Copy to clipboard with transient feedback
  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = password;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Save recipe configuration (WITHOUT password) to Supabase password_history table
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccessMsg(null);

    if (!recipeLabel.trim()) {
      setSaveError('Please enter a label for this password recipe (e.g., "Work Email" or "AWS Console").');
      return;
    }

    if (!user) {
      setSaveError('You must be signed in to save password recipes to Supabase.');
      return;
    }

    if (!isSupabaseConfigured) {
      setSaveError('Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY) are not configured.');
      return;
    }

    setIsSavingRecipe(true);

    try {
      // Save ONLY the recipe configuration. NEVER save the password itself.
      const { error: insertError } = await supabase
        .from('password_history')
        .insert({
          user_id: user.id,
          label: recipeLabel.trim(),
          length: options.length,
          use_upper: options.useUpper,
          use_lower: options.useLower,
          use_numbers: options.useNumbers,
          use_symbols: options.useSymbols,
        });

      if (insertError) {
        // Show exact error as requested
        setSaveError(`Supabase Error: ${formatSupabaseError(insertError)}`);
      } else {
        setSaveSuccessMsg(`Saved recipe "${recipeLabel.trim()}" to audit history!`);
        setRecipeLabel('');
        if (onHistoryItemAdded) {
          onHistoryItemAdded();
        }
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err) {
      setSaveError(`Supabase Error: ${formatSupabaseError(err)}`);
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const strength = calculateStrength(password);

  const lengthPresets = [12, 16, 20, 24, 32, 48, 64];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Page Title & Cryptographic Assurance */}
      <div className="text-center sm:text-left space-y-1.5">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono text-[#818cf8] tracking-wider uppercase">
          <Key className="w-3.5 h-3.5" />
          <span>Obsidian Cipher · Cryptographic Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
          Fortified Password Generator
        </h1>
        <p className="text-xs sm:text-sm text-[#908fa0]">
          Generated with hardware entropy (<code className="text-[#c0c1ff] font-mono">crypto.getRandomValues</code>). Never sent to any server.
        </p>
      </div>

      {/* Hero Password Display Card (Layer 2 Floating Glass Card) */}
      <div className="relative glass-panel rounded-2xl p-5 sm:p-7 border border-[#818cf8]/30 shadow-2xl transition-all">
        {/* Recessed well containing syntax-highlighted password */}
        <div className="recessed-well rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full overflow-x-auto select-all py-1">
            <div className="font-mono text-lg sm:text-2xl tracking-wider break-all leading-relaxed whitespace-pre-wrap">
              {password.split('').map((char, index) => (
                <span
                  key={index}
                  className={`${getCharColorClass(char)} transition-colors duration-200`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Copy & Refresh Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={handleGenerate}
              className={`p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#818cf8] hover:text-white transition-all cursor-pointer ${
                isRegenerating ? 'rotate-180 scale-95' : ''
              }`}
              title="Generate fresh password"
              aria-label="Generate fresh password"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs tracking-wider transition-all cursor-pointer ${
                copied
                  ? 'bg-[#10b981] text-[#003824] shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                  : 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white hover:from-[#4f46e5] hover:to-[#6366f1] shadow-[0_0_20px_rgba(99,102,241,0.35)] active:scale-95'
              }`}
              aria-label="Copy password to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Character color legend indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 text-[11px] text-[#908fa0]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              Letters
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#818cf8]"></span>
              Numbers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              Symbols
            </span>
          </div>

          <span className="font-mono text-[11px] text-[#c0c1ff]">
            {password.length} characters
          </span>
        </div>

        {/* Strength & Entropy Meter */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <StrengthMeter strength={strength} length={password.length} />
        </div>
      </div>

      {/* Generator Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Length Control Card */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5 border border-white/5">
          <div className="flex items-center justify-between">
            <label htmlFor="length-slider" className="text-sm font-semibold text-white tracking-wide">
              Password Length
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#1e1b4b] border border-[#818cf8]/40 font-mono text-base font-bold text-[#c0c1ff] tabular-nums">
                {options.length}
              </span>
              <span className="text-xs text-[#908fa0]">chars</span>
            </div>
          </div>

          {/* Slider (Range 8 - 64) */}
          <div className="space-y-2">
            <input
              id="length-slider"
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
              className="w-full cyber-slider cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#908fa0]">
              <span>8 min</span>
              <span>16</span>
              <span>32</span>
              <span>48</span>
              <span>64 max</span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="pt-2">
            <span className="text-[11px] text-[#908fa0] block mb-2 font-medium">Quick Presets:</span>
            <div className="flex flex-wrap gap-2">
              {lengthPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOptions({ ...options, length: preset })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    options.length === preset
                      ? 'bg-[#6366f1] text-white font-bold shadow-md shadow-[#6366f1]/40'
                      : 'bg-white/5 text-[#908fa0] hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Character Set Toggles */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 border border-white/5">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Character Complexity
          </h2>

          <div className="space-y-3">
            {/* Uppercase */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/5 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-mono font-bold text-xs text-white">
                  ABC
                </span>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-white block">Uppercase Letters</span>
                  <span className="text-[11px] text-[#908fa0] font-mono">A-Z</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={options.useUpper}
                onChange={(e) => setOptions({ ...options, useUpper: e.target.checked })}
                className="w-5 h-5 accent-[#6366f1] rounded cursor-pointer"
              />
            </label>

            {/* Lowercase */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/5 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-mono font-bold text-xs text-white">
                  abc
                </span>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-white block">Lowercase Letters</span>
                  <span className="text-[11px] text-[#908fa0] font-mono">a-z</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={options.useLower}
                onChange={(e) => setOptions({ ...options, useLower: e.target.checked })}
                className="w-5 h-5 accent-[#6366f1] rounded cursor-pointer"
              />
            </label>

            {/* Numbers */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/5 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-mono font-bold text-xs text-[#818cf8]">
                  123
                </span>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-white block">Numbers</span>
                  <span className="text-[11px] text-[#908fa0] font-mono">0-9</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={options.useNumbers}
                onChange={(e) => setOptions({ ...options, useNumbers: e.target.checked })}
                className="w-5 h-5 accent-[#6366f1] rounded cursor-pointer"
              />
            </label>

            {/* Symbols */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/5 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-mono font-bold text-xs text-[#10b981]">
                  #$&
                </span>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-white block">Special Symbols</span>
                  <span className="text-[11px] text-[#908fa0] font-mono">!@#$%^&*...</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={options.useSymbols}
                onChange={(e) => setOptions({ ...options, useSymbols: e.target.checked })}
                className="w-5 h-5 accent-[#6366f1] rounded cursor-pointer"
              />
            </label>

            {/* Look-alike characters toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#1e1b4b]/30 hover:bg-[#1e1b4b]/50 border border-[#818cf8]/20 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#818cf8]/10 flex items-center justify-center font-mono text-xs text-[#c0c1ff]">
                  i|1
                </span>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-[#c0c1ff] block">
                    Exclude Look-alike Characters
                  </span>
                  <span className="text-[11px] text-[#908fa0] font-mono">
                    Omits ambiguous glyphs (i, l, 1, I, o, 0, O)
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={options.excludeLookAlike}
                onChange={(e) => setOptions({ ...options, excludeLookAlike: e.target.checked })}
                className="w-5 h-5 accent-[#6366f1] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Generate Button CTA */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          className="w-full sm:w-auto min-w-[280px] flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold tracking-wider text-white bg-gradient-to-r from-[#6366f1] via-[#8083ff] to-[#4f46e5] hover:opacity-95 shadow-lg shadow-[#6366f1]/35 active:scale-98 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>GENERATE NEW CIPHER</span>
        </button>
      </div>

      {/* Save Recipe to Audit History Card */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-[#6366f1]/20 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookmarkPlus className="w-4 h-4 text-[#818cf8]" />
              Save Recipe to Supabase Audit History
            </h2>
            <p className="text-xs text-[#908fa0] mt-1">
              Saves the configuration parameters (length: <span className="text-white font-mono">{options.length}</span>, uppercase, lowercase, numbers, symbols) into the Supabase <code className="text-[#818cf8] font-mono">password_history</code> table.
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 shrink-0">
            Zero-Knowledge
          </span>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs text-[#c7c4d7]">
          <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
          <p>
            <strong className="text-white font-medium">Privacy Law:</strong> The generated password itself is <strong>never stored</strong> in Supabase or localStorage. Only the recipe label and generation parameters are archived so you can reconstruct policies at will.
          </p>
        </div>

        {/* Form or Auth Prompt */}
        {user ? (
          <form onSubmit={handleSaveRecipe} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Audit Label (e.g., 'Work GitHub SSO', 'AWS Root Access')"
                value={recipeLabel}
                onChange={(e) => setRecipeLabel(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl recessed-well text-sm text-white placeholder-[#908fa0] focus:outline-none focus:border-[#818cf8] transition-colors"
              />
              <button
                type="submit"
                disabled={isSavingRecipe}
                className="px-6 py-2.5 rounded-xl bg-[#1e1b4b] hover:bg-[#2f3aa3] border border-[#818cf8]/40 text-white text-xs font-semibold tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <BookmarkPlus className="w-4 h-4 text-[#818cf8]" />
                <span>{isSavingRecipe ? 'Saving...' : 'Save Recipe'}</span>
              </button>
            </div>

            {/* Error Message if Supabase fails */}
            {saveError && (
              <div className="p-3 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/30 flex items-start gap-2.5 text-xs text-[#ffb4ab]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#f43f5e]" />
                <div className="break-all">
                  <strong>Supabase Operation Failed:</strong> {saveError}
                </div>
              </div>
            )}

            {/* Success Message */}
            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-between gap-2.5 text-xs text-[#4edea3]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-[#10b981]" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToHistory}
                  className="underline hover:text-white font-medium cursor-pointer"
                >
                  View History →
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl recessed-well border border-white/5">
            <div className="text-xs text-[#908fa0]">
              Sign in with your Supabase account to sync and audit password generation recipes.
            </div>
            <button
              onClick={onNavigateToAuth}
              className="px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer shadow-md shadow-[#6366f1]/25"
            >
              Sign In to Sync History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
