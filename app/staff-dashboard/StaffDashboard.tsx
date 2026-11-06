"use client";

// Phase 1: a bare staff dashboard. Lists closures and help requests live,
// with working closure toggles, volunteer assignment and demo reset.
// The full prototype console UI arrives in Phase 3.

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { assignVolunteer, resetDemo, setClosure } from "@/app/actions";
import { isClosureKey } from "@/lib/navconnect/routes";
import { langTag, minutesAgo, requestText } from "@/lib/navconnect/staff";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTableChanges } from "@/lib/supabase/use-table-changes";
import { unwrap, type Row } from "@/lib/supabase/utils";
import styles from "./staff-dashboard.module.css";

type Closure = Row<"closures">;
type HelpRequest = Row<"help_requests">;

const byNewest = (a: HelpRequest, b: HelpRequest) => b.created_at.localeCompare(a.created_at);

/** Apply an INSERT or UPDATE to a list, keyed by `key`. DELETEs are handled by resyncing. */
function upsert<T>(list: T[], row: T, key: (r: T) => string): T[] {
  const k = key(row);
  const i = list.findIndex((r) => key(r) === k);
  if (i === -1) return [...list, row];
  const next = list.slice();
  next[i] = row;
  return next;
}

/** Debounce a callback, e.g. to collapse the burst of DELETE events from reset_demo(). */
function useDebounced(fn: () => void, ms: number): () => void {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(), ms);
  }, [ms]);
}

export function StaffDashboard() {
  const [closures, setClosures] = useState<Closure[] | null>(null);
  const [requests, setRequests] = useState<HelpRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Set when requests load (not during render, which Next.js prerenders).
  const [now, setNow] = useState(0);

  // Keep "x min ago" fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const loadClosures = useCallback(async () => {
    try {
      const rows = unwrap(
        await getSupabaseBrowserClient().from("closures").select("*").order("key"),
      );
      setClosures(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const rows = unwrap(
        await getSupabaseBrowserClient()
          .from("help_requests")
          .select("*")
          .order("created_at", { ascending: false }),
      );
      setRequests(rows);
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const resyncClosures = useDebounced(loadClosures, 250);
  const resyncRequests = useDebounced(loadRequests, 250);

  useTableChanges("closures", {
    onResync: loadClosures,
    onChange: (p: RealtimePostgresChangesPayload<Closure>) => {
      if (p.eventType === "DELETE") return resyncClosures();
      setClosures((list) => upsert(list ?? [], p.new, (r) => r.key));
    },
  });

  useTableChanges("help_requests", {
    onResync: loadRequests,
    onChange: (p: RealtimePostgresChangesPayload<HelpRequest>) => {
      if (p.eventType === "DELETE") return resyncRequests();
      setRequests((list) => upsert(list ?? [], p.new, (r) => r.id).sort(byNewest));
    },
  });

  async function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(id);
    setError(null);
    const result = await action();
    if (!result.ok) setError(result.error ?? "Something went wrong.");
    setBusy(null);
  }

  function onToggle(c: Closure) {
    if (!isClosureKey(c.key)) return;
    const key = c.key;
    void run(`closure:${key}`, () => setClosure(key, !c.is_closed));
  }

  function onReset() {
    if (!window.confirm("Reset the demo to its starting state? This clears all live requests.")) return;
    void run("reset", async () => {
      const result = await resetDemo();
      // Realtime delivers the changes too; reload so this screen is right immediately.
      await Promise.all([loadClosures(), loadRequests()]);
      return result;
    });
  }

  const open = requests?.filter((r) => r.status === "open").length ?? 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>NavConnect staff dashboard</h1>
          <p className={styles.tag}>Sample data · not live hospital data</p>
        </div>
        <button className={styles.btn} onClick={onReset} disabled={busy !== null}>
          {busy === "reset" ? "Resetting…" : "Reset demo"}
        </button>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <section className={styles.card} aria-labelledby="closures-h">
        <h2 id="closures-h">Closures</h2>
        {closures === null ? (
          <p className={styles.muted}>Loading…</p>
        ) : (
          <ul className={styles.list}>
            {closures.map((c) => (
              <li key={c.key} className={styles.row}>
                <div>
                  <strong>{c.label}</strong>
                  <small>{c.description}</small>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={c.is_closed}
                  aria-label={`${c.label} closed`}
                  className={styles.switch}
                  onClick={() => onToggle(c)}
                  disabled={busy === `closure:${c.key}`}
                >
                  {c.is_closed ? "Closed" : "Open"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.card} aria-labelledby="requests-h">
        <h2 id="requests-h">
          Help requests <span className={styles.muted}>· {open} open</span>
        </h2>
        {requests === null ? (
          <p className={styles.muted}>Loading…</p>
        ) : requests.length === 0 ? (
          <p className={styles.muted}>No requests.</p>
        ) : (
          <ul className={styles.list}>
            {requests.map((r) => (
              <li key={r.id} className={styles.row} data-status={r.status}>
                <div>
                  <strong>{requestText(r)}</strong>
                  <small>
                    {r.location} · {langTag(r.lang)} · {minutesAgo(r.created_at, now)}
                    {!r.client_id.startsWith("seed-") && " · from a visitor's phone"}
                  </small>
                </div>
                {r.status === "open" ? (
                  <button
                    className={styles.btn}
                    onClick={() => void run(`assign:${r.id}`, () => assignVolunteer(r.id))}
                    disabled={busy === `assign:${r.id}`}
                  >
                    Assign volunteer
                  </button>
                ) : (
                  <span className={styles.status}>
                    {r.status === "done" ? `Done · ${r.volunteer}` : `${r.volunteer} on the way`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
