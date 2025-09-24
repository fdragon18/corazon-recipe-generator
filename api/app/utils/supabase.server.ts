import { createClient } from "@supabase/supabase-js";

declare global {
  var supabaseGlobal: ReturnType<typeof createClient>;
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

// Server-side Supabase client with service role key for admin operations
let supabase: ReturnType<typeof createClient>;

if (process.env.NODE_ENV === "production") {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  if (!global.supabaseGlobal) {
    global.supabaseGlobal = createClient(supabaseUrl, supabaseServiceKey);
  }
  supabase = global.supabaseGlobal;
}

export { supabase };