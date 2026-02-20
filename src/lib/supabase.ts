import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Fallbacks if environment variables are missing or invalid strings
  if (!supabaseUrl || supabaseUrl === 'undefined' || !isValidUrl(supabaseUrl)) {
    supabaseUrl = 'https://lebxffvaovepglbeqtsg.supabase.co';
  }
  
  if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
    supabaseAnonKey = 'sb_publishable_Q3ptCczH3ldJd9Jj_kGEqA_-MQyN7Nt';
  }

  if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
    console.error('Supabase configuration error:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });
    throw new Error('Invalid Supabase configuration. Please check your environment variables.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

// Export a proxy or a getter-based object to avoid top-level execution issues
// but maintain backward compatibility for imports like `import { supabase } from ...`
export const supabase = createClient(
  'https://lebxffvaovepglbeqtsg.supabase.co',
  'sb_publishable_Q3ptCczH3ldJd9Jj_kGEqA_-MQyN7Nt'
);
