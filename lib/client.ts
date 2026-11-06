// Browser Supabase client (anon / publishable key).
// Use it in Client Components for reads and realtime subscriptions.
// Writes go through Server Actions using the admin client in ./server.ts.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

let browserClient: SupabaseClient<Database> | undefined;

/**
 * Returns one shared client per browser tab, so every hook reuses a single realtime connection.
 * Call it from effects or event handlers, not during render.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      // The demo has no logins, so skip session storage and token refresh.
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return browserClient;
}
