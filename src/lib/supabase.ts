import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create supabase client only if credentials are available
// During build time, these may be empty - we use a dummy URL to avoid errors
let supabase: SupabaseClient;
let supabaseAdmin: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  );
} else {
  // Dummy client for build time - will fail gracefully at runtime
  const dummyUrl = 'https://placeholder.supabase.co';
  const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDg3NjI1MTQsImV4cCI6MTk2NDMzODUxNH0.placeholder';
  supabase = createClient(dummyUrl, dummyKey);
  supabaseAdmin = supabase;
}

export { supabase, supabaseAdmin };

// Types for strategy_updates table
export interface StrategyUpdate {
  id: string;
  creator_id: string;
  portfolio_id: string;
  content: string;
  created_at: string;
}

export interface StrategyUpdateInsert {
  creator_id: string;
  portfolio_id: string;
  content: string;
}
