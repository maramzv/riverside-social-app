// Shared team Supabase project — same client-side, no-env-vars pattern used by
// the other Riverside product repos (Erick's, Ishmam's). RLS on these shared
// tables is intentionally open (anon read/write), so no auth setup is needed.
export const SUPABASE_URL = "https://wulylpywtdgoxamwlxlu.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bHlscHl3dGRnb3hhbXdseGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTgyMjYsImV4cCI6MjEwMjczNDIyNn0.6usgf9zXJ3ewsRrklNPBX1ByrAPybWsd2UGc2BPg_-I";
