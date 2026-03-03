import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Anon client – respects RLS, safe for server-side use in SSR pages/services
export const supabase = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

// Admin client – bypasses RLS; use ONLY in trusted server contexts (webhooks, edge functions)
export const supabaseAdmin = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
