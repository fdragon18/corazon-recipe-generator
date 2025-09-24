import { createClient } from "@supabase/supabase-js";

const supabaseUrl = window.ENV?.SUPABASE_URL;
const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_ANON_KEY environment variable is required");
}

// Client-side Supabase client with anon key for user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);