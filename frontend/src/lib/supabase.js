import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Running in offline/demo mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,         // Store JWT in localStorage (default, but explicit)
        autoRefreshToken: true,        // Auto-refresh before expiry (default, but explicit)
        storageKey: 'habitflow-auth',  // Stable key across app versions
        detectSessionInUrl: true,      // Handle OAuth redirects
      },
    })
  : null;

export const isSupabaseReady = !!supabase;

