const API_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export function getApiBase(): string {
  return String(API_BASE || '').replace(/\/$/, '');
}