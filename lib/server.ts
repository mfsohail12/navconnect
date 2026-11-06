// Server-only Supabase client (secret key). Bypasses Row Level Security.
// Import it only from Server Actions, Route Handlers and Server Components.
// The `server-only` import makes the build fail if a Client Component imports this file.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseUrl } from "./env";

let adminClient: SupabaseClient<Database> | undefined;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (!adminClient) {
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "Missing environment variable SUPABASE_SECRET_KEY. Add it to .env.local and your hosting provider's settings. Never prefix it with NEXT_PUBLIC_.",
      );
    }
    adminClient = createClient<Database>(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return adminClient;
}
