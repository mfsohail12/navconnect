// Shared helpers for Supabase code. Safe to import from browser and server code.

import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type PublicSchema = Database["public"];

/** Names of the tables in the public schema, from the generated types. */
export type TableName = keyof PublicSchema["Tables"] & string;
/** Row type of a table, e.g. `Row<"help_requests">`. */
export type Row<T extends TableName> = PublicSchema["Tables"][T]["Row"];
/** Insert type of a table, e.g. `Insert<"help_requests">`. */
export type Insert<T extends TableName> = PublicSchema["Tables"][T]["Insert"];
/** Update type of a table, e.g. `Update<"help_requests">`. */
export type Update<T extends TableName> = PublicSchema["Tables"][T]["Update"];

/**
 * Turns a Supabase result into its data, or throws its error.
 * Example: `const rows = unwrap(await supabase.from("closures").select("*"));`
 */
export function unwrap<T>(result: {
  data: T | null;
  error: PostgrestError | null;
}): T {
  if (result.error) {
    throw new Error(
      `Supabase error: ${result.error.message}${result.error.details ? ` (${result.error.details})` : ""}`,
    );
  }
  if (result.data === null) {
    throw new Error("Supabase returned no data.");
  }
  return result.data;
}

const CLIENT_ID_KEY = "navconnect-client-id";
let memoryClientId: string | undefined;

function randomId(): string {
  // Not crypto.randomUUID(): it's only available over https or localhost, and phones
  // testing against http://<your-lan-ip>:3000 would crash on it.
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
  );
}

/**
 * A stable anonymous ID for this device, stored in localStorage.
 * Falls back to an in-memory ID when storage is blocked (e.g. some private-browsing modes).
 * Call it in the browser only (effects or event handlers).
 */
export function getClientId(): string {
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = randomId();
    window.localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    memoryClientId ??= randomId();
    return memoryClientId;
  }
}
