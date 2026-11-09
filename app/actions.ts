"use server";

// All writes to the shared demo state. Called from Client Components.
// Server Actions are reachable by direct POST, so every input is validated here.
// Each action returns a result instead of throwing, because thrown errors are
// replaced by a generic message in production builds.

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { isDestId } from "@/lib/navconnect/destinations";
import { isClosureKey } from "@/lib/navconnect/routes";
import { VOLS, activityMessages } from "@/lib/navconnect/staff";
import type { ClosureKey, DestId, HelpReason } from "@/lib/navconnect/types";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

const OK: ActionResult = { ok: true, data: null };

const UNAUTHORIZED = { ok: false, error: "Staff password required." } as const;

const HELP_REASONS: readonly HelpReason[] = ["lost", "wheelchair", "interpreter", "other", "escort"];

function fail(error: unknown): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[actions]", message);
  return { ok: false, error: message };
}

/** Trim and cap a free-text field. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().slice(0, max);
  return t || null;
}

async function logActivity(message: string): Promise<void> {
  const { error } = await getSupabaseAdminClient().from("activity").insert({ message });
  // The main write already succeeded; a missing feed entry shouldn't fail the action.
  if (error) console.error("[actions] activity insert failed:", error.message);
}

// ---------------------------------------------------------------------------
// Help requests
// ---------------------------------------------------------------------------

export type SendHelpRequestInput = {
  clientId: string;
  reason: HelpReason;
  lang: string;
  /** Plain-English location (from LM_EN_PLAIN). */
  location: string;
  destination?: DestId | null;
  /** Closure key, for escort requests from the closure choice sheet. */
  escortFor?: ClosureKey | null;
  note?: string | null;
};

export async function sendHelpRequest(
  input: SendHelpRequestInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const clientId = text(input.clientId, 64);
    const location = text(input.location, 120);
    const lang = text(input.lang, 8) ?? "en";
    if (!clientId) return { ok: false, error: "Missing client id." };
    if (!location) return { ok: false, error: "Missing location." };
    if (!HELP_REASONS.includes(input.reason)) return { ok: false, error: "Unknown reason." };

    const destination = isDestId(input.destination) ? input.destination : null;
    const escortFor = isClosureKey(input.escortFor) ? input.escortFor : null;
    if (input.reason === "escort" && !escortFor) {
      return { ok: false, error: "Escort requests need a closure." };
    }

    const row = {
      client_id: clientId,
      reason: input.reason,
      lang,
      location,
      destination,
      escort_for: input.reason === "escort" ? escortFor : null,
      note: text(input.note, 200),
    };
    const { data, error } = await getSupabaseAdminClient()
      .from("help_requests")
      .insert(row)
      .select("id")
      .single();
    if (error) return fail(error);

    await logActivity(activityMessages.newRequest(row));
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function assignVolunteer(
  requestId: string,
): Promise<ActionResult<{ volunteer: string }>> {
  if (!(await isStaffAuthenticated())) return UNAUTHORIZED;
  try {
    const id = text(requestId, 64);
    if (!id) return { ok: false, error: "Missing request id." };
    const supabase = getSupabaseAdminClient();

    // Rotate through VOLS by how many live requests already have a volunteer.
    // Derived from the database because serverless instances don't share memory.
    const { count, error: countError } = await supabase
      .from("help_requests")
      .select("id", { count: "exact", head: true })
      .not("volunteer", "is", null)
      .not("client_id", "like", "seed-%");
    if (countError) return fail(countError);
    const volunteer = VOLS[(count ?? 0) % VOLS.length];

    // Only an open request can be assigned, so a double click can't assign twice.
    const { data, error } = await supabase
      .from("help_requests")
      .update({ status: "assigned", volunteer, assigned_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "open")
      .select("reason, lang, location, note, destination, escort_for")
      .maybeSingle();
    if (error) return fail(error);
    if (!data) return { ok: false, error: "That request is no longer open." };

    await logActivity(activityMessages.assigned({ ...data, volunteer }));
    return { ok: true, data: { volunteer } };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Closures and detours
// ---------------------------------------------------------------------------

/** Marks an assigned request as resolved, which frees its volunteer. */
export async function completeRequest(requestId: string): Promise<ActionResult> {
  if (!(await isStaffAuthenticated())) return UNAUTHORIZED;
  try {
    const id = text(requestId, 64);
    if (!id) return { ok: false, error: "Missing request id." };
    const supabase = getSupabaseAdminClient();

    // Only an assigned request can be resolved, so a double click can't log it twice.
    const { data, error } = await supabase
      .from("help_requests")
      .update({ status: "done" })
      .eq("id", id)
      .eq("status", "assigned")
      .select("reason, lang, location, note, destination, escort_for, volunteer")
      .maybeSingle();
    if (error) return fail(error);
    if (!data) return { ok: false, error: "That request isn't assigned." };

    await logActivity(
      activityMessages.resolved({ ...data, volunteer: data.volunteer ?? "A volunteer" }),
    );
    return OK;
  } catch (e) {
    return fail(e);
  }
}

export async function setClosure(key: ClosureKey, closed: boolean): Promise<ActionResult> {
  if (!(await isStaffAuthenticated())) return UNAUTHORIZED;
  try {
    if (!isClosureKey(key)) return { ok: false, error: "Unknown closure." };
    if (typeof closed !== "boolean") return { ok: false, error: "Invalid value." };

    // Set an explicit value (not a flip) so repeated clicks are idempotent.
    const { data, error } = await getSupabaseAdminClient()
      .from("closures")
      .update({ is_closed: closed, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select("key")
      .maybeSingle();
    if (error) return fail(error);
    if (!data) return { ok: false, error: "Closure not found. Try Reset demo." };

    await logActivity(activityMessages.closure(key, closed));
    return OK;
  } catch (e) {
    return fail(e);
  }
}

export async function logDetourChoice(key: ClosureKey, destination: DestId): Promise<ActionResult> {
  try {
    if (!isClosureKey(key) || !isDestId(destination)) {
      return { ok: false, error: "Invalid detour." };
    }
    const { error } = await getSupabaseAdminClient()
      .from("activity")
      .insert({ message: activityMessages.detour(key, destination) });
    if (error) return fail(error);
    return OK;
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Arrivals and reset
// ---------------------------------------------------------------------------

export async function recordArrival(
  destination: DestId,
  seconds: number,
  lang: string,
): Promise<ActionResult> {
  try {
    if (!isDestId(destination)) return { ok: false, error: "Unknown destination." };
    const secs = Number.isFinite(seconds) ? Math.max(0, Math.min(3600, Math.round(seconds))) : 0;

    const { error } = await getSupabaseAdminClient().rpc("record_arrival", {
      p_destination: destination,
    });
    if (error) return fail(error);

    await logActivity(activityMessages.arrival(destination, secs, text(lang, 8) ?? "en"));
    return OK;
  } catch (e) {
    return fail(e);
  }
}

export async function resetDemo(): Promise<ActionResult> {
  if (!(await isStaffAuthenticated())) return UNAUTHORIZED;
  try {
    const { error } = await getSupabaseAdminClient().rpc("reset_demo");
    if (error) return fail(error);
    return OK;
  } catch (e) {
    return fail(e);
  }
}
