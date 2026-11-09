"use client";

// The staff & volunteer console, ported from the prototype and backed by Supabase.
// Everything shown is live: closures, help requests, activity, top destinations and
// arrivals via table changes; active navigations via Presence (a live count of phones, no baseline).

import { useState, useSyncExternalStore } from "react";
import { MarkIcon } from "@/components/Icon";
import { assignVolunteer, completeRequest, resetDemo, setClosure } from "@/app/actions";
import { isDestId } from "@/lib/navconnect/destinations";
import { isClosureKey } from "@/lib/navconnect/routes";
import type { DestId } from "@/lib/navconnect/types";
import {
  TIME_SAVED_HOURS,
  VOLUNTEER_ROSTER,
  LANGUAGE_MIX,
  langTag,
  minutesAgo,
  requestText,
} from "@/lib/navconnect/staff";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getNavigationCount,
  subscribeNavigationCount,
} from "@/lib/supabase/presence";
import { unwrap, type Row } from "@/lib/supabase/utils";
import styles from "./staff-dashboard.module.css";
import { HeatMap } from "./HeatMap";
import { useLiveTable } from "./useLiveTable";

type Closure = Row<"closures">;
type HelpRequest = Row<"help_requests">;
type Activity = Row<"activity">;

const FEED_LIMIT = 50;

/** Class names using the prototype's names. */
function cx(...names: (string | false | null | undefined)[]): string {
  return names
    .filter((n): n is string => Boolean(n))
    .map((n) => styles[n] ?? n)
    .join(" ");
}

// ---- clock for "x min ago" (browser only; 0 during server render) ----------

let nowValue = 0;
function subscribeNow(cb: () => void) {
  const t = setInterval(() => {
    nowValue = Date.now();
    cb();
  }, 30_000);
  return () => clearInterval(t);
}
function getNow() {
  if (!nowValue) nowValue = Date.now();
  return nowValue;
}
function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow, () => 0);
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const newestFirst = (a: { created_at: string }, b: { created_at: string }) =>
  b.created_at.localeCompare(a.created_at);

// ---- loaders ----------------------------------------------------------------

const db = () => getSupabaseBrowserClient();

async function loadClosures() {
  return unwrap(
    await db().from("closures").select("*").order("key", { ascending: false }),
  );
}
async function loadRequests() {
  return unwrap(
    await db()
      .from("help_requests")
      .select("*")
      .order("created_at", { ascending: false }),
  );
}
async function loadActivity() {
  return unwrap(
    await db()
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT),
  );
}
async function loadCounts() {
  return unwrap(await db().from("destination_counts").select("*"));
}
async function loadStats() {
  return unwrap(await db().from("demo_stats").select("*"));
}

// ---- component ----------------------------------------------------------------

export function StaffDashboard() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<ReadonlySet<number>>(new Set());
  const now = useNow();
  const liveNavs = useSyncExternalStore(
    subscribeNavigationCount,
    getNavigationCount,
    () => 0,
  );

  const closures = useLiveTable("closures", {
    load: loadClosures,
    key: (r) => r.key,
    onError: setError,
  });
  const requests = useLiveTable("help_requests", {
    load: loadRequests,
    key: (r) => r.id,
    sort: newestFirst,
    onError: setError,
  });
  const activity = useLiveTable("activity", {
    load: loadActivity,
    key: (r) => String(r.id),
    sort: newestFirst,
    // Highlight entries that arrive live (not on reload).
    onInsert: (r) => setFresh((s) => new Set(s).add(r.id)),
    onError: setError,
  });
  const counts = useLiveTable("destination_counts", {
    load: loadCounts,
    key: (r) => r.destination,
    onError: setError,
  });
  const stats = useLiveTable("demo_stats", {
    load: loadStats,
    key: (r) => r.key,
    onError: setError,
  });

  async function run(
    id: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) {
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
    if (
      !window.confirm(
        "Reset the demo to its starting state? This clears all live requests and activity.",
      )
    ) {
      return;
    }
    void run("reset", resetDemo);
  }

  // ---- derived values ----

  const open = requests?.filter((r) => r.status === "open").length;
  // A volunteer is unavailable while they have an assigned request; everyone else is available.
  const busyVolunteers = requests
    ? new Set(
        requests
          .filter((r) => r.status === "assigned" && r.volunteer)
          .map((r) => r.volunteer),
      ).size
    : undefined;
  const volunteersUnavailable =
    busyVolunteers === undefined
      ? undefined
      : Math.min(busyVolunteers, VOLUNTEER_ROSTER.length);
  const volunteersAvailable =
    volunteersUnavailable === undefined
      ? undefined
      : VOLUNTEER_ROSTER.length - volunteersUnavailable;
  const stat = (key: string) => stats?.find((s) => s.key === key)?.value;
  const arrivals = stat("arrivals_today");

  const visitCounts: Partial<Record<DestId, number>> = {};
  for (const c of counts ?? [])
    if (isDestId(c.destination)) visitCounts[c.destination] = c.count;

  const feed = (activity ?? []).slice(0, FEED_LIMIT);
  const show = (v: number | undefined) => (v === undefined ? "–" : v);

  return (
    <main className={cx("page")}>
      <div className={cx("wrap")}>
        <header className={cx("top")}>
          <div className={cx("brand")}>
            <div className={cx("mark")} aria-hidden="true">
              <MarkIcon size={22} stroke={2.4} />
            </div>
            <div>
              <h1>NavConnect</h1>
            </div>
          </div>
        </header>

        <section className={cx("console")} aria-label="Staff console">
          <div className={cx("c-head")}>
            <div>
              <p className={cx("eyebrow")}>Staff &amp; volunteer console</p>
              <h2>Lakeridge Health Oshawa · 1 Hospital Court</h2>
            </div>
            <div className={cx("head-actions")}>
              <span className={cx("tag")}>
                Sample data · not live hospital data
              </span>
              <button
                className={cx("reset")}
                onClick={onReset}
                disabled={busy !== null}
              >
                {busy === "reset" ? "Resetting…" : "Reset demo"}
              </button>
            </div>
          </div>

          {error && (
            <p className={cx("error")} role="alert">
              {error}
            </p>
          )}

          <div className={cx("tiles")}>
            <div className={cx("tile")}>
              <span>Active navigations</span>
              <b>{liveNavs}</b>
              <small>right now</small>
            </div>
            <div className={cx("tile", "alert")}>
              <span>Open help requests</span>
              <b>{show(open)}</b>
              <small>waiting for a volunteer</small>
            </div>
            <div className={cx("tile")}>
              <span>Volunteers</span>
              <b className={cx("avail")}>
                {show(volunteersAvailable)}
                <small style={{ fontSize: "0.9rem" }}> available</small>
              </b>
              <small className={cx("unavail")}>
                {show(volunteersUnavailable)} unavailable
              </small>
            </div>
            <div className={cx("tile")}>
              <span>Total time saved</span>
              <b>
                {TIME_SAVED_HOURS}
                <small style={{ fontSize: "0.9rem" }}> hrs</small>
              </b>
              <small>today</small>
            </div>
            <div className={cx("tile")}>
              <span>Arrivals today</span>
              <b>{show(arrivals)}</b>
              <small>completed routes</small>
            </div>
          </div>

          <div className={cx("c-grid")}>
            <div className={cx("panel")}>
              <h3>
                Help requests{" "}
                <span className={cx("cnt")}>{show(open)} open</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests?.length === 0 && (
                  <p className={cx("empty")}>No requests.</p>
                )}
                {requests?.map((r: HelpRequest) => {
                  const live = !r.client_id.startsWith("seed-");
                  return (
                    <div
                      key={r.id}
                      className={cx("req", r.status, live && "live")}
                    >
                      <div className={cx("req-main")}>
                        <strong>{requestText(r)}</strong>
                        <small>
                          {r.location} ·{" "}
                          <span className={cx("lang-tag")}>
                            {langTag(r.lang)}
                          </span>{" "}
                          · {now ? minutesAgo(r.created_at, now) : ""}
                          {live && (
                            <span className={cx("live-tag")}>
                              ● from demo phone
                            </span>
                          )}
                        </small>
                      </div>
                      {r.status === "open" ? (
                        <button
                          className={cx("c-btn")}
                          onClick={() =>
                            void run(`assign:${r.id}`, () =>
                              assignVolunteer(r.id),
                            )
                          }
                          disabled={busy === `assign:${r.id}`}
                        >
                          Assign volunteer
                        </button>
                      ) : r.status === "assigned" ? (
                        <div className={cx("req-actions")}>
                          <span className={cx("status")}>
                            {r.volunteer} on the way
                          </span>
                          <button
                            className={cx("c-btn", "ghost")}
                            onClick={() =>
                              void run(`complete:${r.id}`, () =>
                                completeRequest(r.id),
                              )
                            }
                            disabled={busy === `complete:${r.id}`}
                          >
                            Mark resolved
                          </button>
                        </div>
                      ) : (
                        <span className={cx("status", "done")}>Resolved</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cx("panel")}>
              <h3>Closures &amp; escorts</h3>
              <div>
                {closures?.map((c) => (
                  <div
                    key={c.key}
                    className={cx("closure", c.is_closed && "on")}
                  >
                    <div>
                      <strong>{c.label}</strong>
                      <small>{c.description}</small>
                    </div>
                    <button
                      type="button"
                      className={cx("sw")}
                      role="switch"
                      aria-checked={c.is_closed}
                      aria-label={`Mark ${c.label} closed`}
                      onClick={() => onToggle(c)}
                      disabled={busy === `closure:${c.key}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={cx("panel")}>
              <h3>Destination heatmap</h3>
              <HeatMap counts={visitCounts} />
            </div>

            <div className={cx("panel")}>
              <h3>Activity log</h3>
              <ul className={cx("feed")} aria-live="polite">
                {feed.map((a: Activity) => (
                  <li key={a.id} className={cx(fresh.has(a.id) && "new")}>
                    <time dateTime={a.created_at}>{fmtTime(a.created_at)}</time>
                    <span>{a.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cx("panel", "wide")}>
              <h3>Navigation language</h3>
              <div className={cx("stack")}>
                {LANGUAGE_MIX.map((l) => (
                  <i
                    key={l.name}
                    style={{
                      width: `${l.pct}%`,
                      background: `var(${l.color})`,
                    }}
                    title={`${l.name} ${l.pct}%`}
                  />
                ))}
              </div>
              <div className={cx("stack-leg")}>
                {LANGUAGE_MIX.map((l) => (
                  <span key={l.name}>
                    <i style={{ background: `var(${l.color})` }} />
                    {l.name} {l.pct}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
