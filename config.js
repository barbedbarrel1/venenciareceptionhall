// ============================================================
// SUPABASE CONFIG
// Get these from: Supabase Dashboard > Settings > API
// The anon key is SAFE to expose in frontend code — Row Level
// Security (RLS) is what actually protects the data.
// ============================================================
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// One shared client for the whole site.
// window.supabase comes from the CDN script tag in each page.
// Falls back to null (instead of throwing) until real keys are set above —
// createClient() throws synchronously on an invalid URL, which would
// otherwise break every page's JS before the keys are configured.
let db = null;
try {
  if (window.supabase && /^https?:\/\//.test(SUPABASE_URL)) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase not configured yet:', e.message);
}