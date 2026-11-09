import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read strictly from import.meta.env only as requested
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-anon-publishable-key')
);

// Fallback dummy or initialized client
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Format exact error from Supabase or JavaScript errors for transparent display
 */
export function formatSupabaseError(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  if (typeof error === 'string') return error;

  const err = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
    status?: number;
    error_description?: string;
  };

  const parts: string[] = [];

  if (err.message) {
    parts.push(err.message);
  } else if (err.error_description) {
    parts.push(err.error_description);
  }

  if (err.code) {
    parts.push(`Code: ${err.code}`);
  }

  if (err.details && err.details !== err.message) {
    parts.push(`Details: ${err.details}`);
  }

  if (err.hint) {
    parts.push(`Hint: ${err.hint}`);
  }

  if (parts.length === 0) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return parts.join(' | ');
}
