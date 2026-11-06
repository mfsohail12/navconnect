"use client";

// The staff & volunteer console, ported from the prototype and backed by Supabase.
// Everything shown is live: closures, help requests, activity, top destinations and
// arrivals via table changes; active navigations via Presence (on top of a seeded baseline).

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { Icon, MarkIcon } from "@/components/Icon";
import { assignVolunteer, resetDemo, setClosure } from "@/app/actions";
import { DEST, isDestId } from "@/lib/navconnect/destinations";
import { I } from "@/lib/navconnect/i18n";
import { isClosureKey } from "@/lib/navconnect/routes";
import {
  ACTIVE_NAV_BASELINE,
  LANGUAGE_MIX,
  langTag,
  minutesAgo,
  requestText,
} from "@/lib/navconnect/staff";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getNavigationCount, subscribeNavigationCount } from "@/lib/supabase/presence";
import { unwrap, type Row } from "@/lib/supabase/utils";
import styles from "./staff-dashboard.module.css";
import { useLiveTable } from "./useLiveTable";

type Closure = Row<"closures">;
type HelpRequest = Row<"help_requests">;
type Activity = Row<"activity">;

const FEED_LIMIT = 50;
const TOP_LIMIT = 5;

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
  return unwrap(await db().from("closures").select("*").order("key", { ascending: false }));
}
async function loadRequests() {
  return unwrap(
    await db().from("help_requests").select("*").order("created_at", { ascending: false }),
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
  const liveNavs = useSyncExternalStore(subscribeNavigationCount, getNavigationCount, () => 0);

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
    if (!window.confirm("Reset the demo to its starting state? This clears all live requests and activity.")) {
      return;
    }
    void run("reset", resetDemo);
  }

  // ---- derived values ----

  const open = requests?.filter((r) => r.status === "open").length;
  const stat = (key: string) => stats?.find((s) => s.key === key)?.value;
  const median = stat("median_minutes");
  const arrivals = stat("arrivals_today");

  const top = (counts ?? [])
    .filter((c) => isDestId(c.destination))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_LIMIT);
  const topMax = Math.max(1, ...top.map((c) => c.count));

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
              <p>Pilot concept for Lakeridge Health Oshawa · Where every step matters</p>
            </div>
          </div>
        </header>

        <section className={cx("console")} aria-label="Staff console">
          <div className={cx("c-head")}>
            <div>
              <p className={cx("eyebrow")}>Staff &amp; volunteer console · concept</p>
              <h2>Lakeridge Health Oshawa · 1 Hospital Court</h2>
            </div>
            <div className={cx("head-actions")}>
              <span className={cx("tag")}>Sample data · not live hospital data</span>
              <button className={cx("reset")} onClick={onReset} disabled={busy !== null}>
                {busy === "reset" ? "Resetting…" : "Reset demo"}
              </button>
            </div>
          </div>

          <p className={cx("tip")}>
            <Icon name="info" />
            <span>
              Try the full loop: start a route to the <b>Dialysis Unit</b> on the phone, then mark
              the <b>Purple Elevator</b> out of service below. The phone offers a detour or a
              volunteer; pick the volunteer and the request lands here for you to assign. Closures
              are demo scenarios, not real outages.
            </span>
          </p>

          {error && (
            <p className={cx("error")} role="alert">
              {error}
            </p>
          )}

          <div className={cx("tiles")}>
            <div className={cx("tile")}>
              <span>Active navigations</span>
              <b>{ACTIVE_NAV_BASELINE + liveNavs}</b>
              <small>right now</small>
            </div>
            <div className={cx("tile", "alert")}>
              <span>Open help requests</span>
              <b>{show(open)}</b>
              <small>waiting for a volunteer</small>
            </div>
            <div className={cx("tile")}>
              <span>Median time to destination</span>
              <b>
                {show(median)}
                <small style={{ fontSize: "0.9rem" }}> min</small>
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
                Help requests <span className={cx("cnt")}>{show(open)} open</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests?.length === 0 && <p className={cx("empty")}>No requests.</p>}
                {requests?.map((r: HelpRequest) => {
                  const live = !r.client_id.startsWith("seed-");
                  return (
                    <div key={r.id} className={cx("req", r.status, live && "live")}>
                      <div className={cx("req-main")}>
                        <strong>{requestText(r)}</strong>
                        <small>
                          {r.location} · <span className={cx("lang-tag")}>{langTag(r.lang)}</span> ·{" "}
                          {now ? minutesAgo(r.created_at, now) : ""}
                          {live && <span className={cx("live-tag")}>● from demo phone</span>}
                        </small>
                      </div>
                      {r.status === "open" ? (
                        <button
                          className={cx("c-btn")}
                          onClick={() => void run(`assign:${r.id}`, () => assignVolunteer(r.id))}
                          disabled={busy === `assign:${r.id}`}
                        >
                          Assign volunteer
                        </button>
                      ) : (
                        <span className={cx("status")}>{r.volunteer} on the way</span>
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
                  <div key={c.key} className={cx("closure", c.is_closed && "on")}>
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
              <h3>Top destinations today</h3>
              <div className={cx("bars")}>
                {top.map((c) => {
                  const id = c.destination as keyof typeof DEST;
                  return (
                    <div
                      key={id}
                      className={cx("bar")}
                      style={{ "--lc": `var(--l-${DEST[id].line})` } as CSSProperties}
                    >
                      <span>{I.en.dest[id]}</span>
                      <span className={cx("tr")}>
                        <i style={{ width: `${((c.count / topMax) * 100).toFixed(1)}%` }} />
                      </span>
                      <b>{c.count}</b>
                    </div>
                  );
                })}
              </div>
              <p className={cx("sub-h")}>Navigation language</p>
              <div className={cx("stack")}>
                {LANGUAGE_MIX.map((l) => (
                  <i
                    key={l.name}
                    style={{ width: `${l.pct}%`, background: `var(${l.color})` }}
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

            <div className={cx("panel")}>
              <h3>Activity</h3>
              <ul className={cx("feed")} aria-live="polite">
                {feed.map((a: Activity) => (
                  <li key={a.id} className={cx(fresh.has(a.id) && "new")}>
                    <time dateTime={a.created_at}>{fmtTime(a.created_at)}</time>
                    <span>{a.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
