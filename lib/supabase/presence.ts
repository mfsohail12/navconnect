// Realtime Presence for "active navigations".
// Phones track themselves on one shared channel while navigating; the dashboard counts them.
//
// One channel per tab, created once and kept open: supabase-js returns the existing channel
// for a topic, and removing one is asynchronous, so creating and removing it per component
// (e.g. React's double-mounted effects in dev) would hand back a channel mid-teardown.
// Call these from effects or event handlers only (browser code).

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

const TOPIC = "navigating";

export type NavigationPresence = {
  dest: string;
  lang: string;
  since: string;
};

let channel: RealtimeChannel | undefined;
let subscribed = false;
/** What this tab should be tracking (null = not navigating). Re-sent after every (re)join. */
let wanted: NavigationPresence | null = null;
let count = 0;
const listeners = new Set<() => void>();

function getChannel(key: string): RealtimeChannel {
  if (channel) return channel;
  const ch = getSupabaseBrowserClient().channel(TOPIC, { config: { presence: { key } } });
  ch.on("presence", { event: "sync" }, () => {
    count = Object.keys(ch.presenceState()).length;
    listeners.forEach((l) => l());
  });
  ch.subscribe((status) => {
    subscribed = status === "SUBSCRIBED";
    if (subscribed && wanted) void ch.track(wanted);
  });
  channel = ch;
  return ch;
}

/** Phone side: start (payload) or stop (null) appearing as an active navigation. */
export function trackNavigation(clientId: string, payload: NavigationPresence | null): void {
  wanted = payload;
  const ch = getChannel(clientId);
  if (!subscribed) return; // the subscribe callback tracks `wanted` once joined
  if (payload) void ch.track(payload);
  else void ch.untrack();
}

/** Dashboard side: subscribe to the number of phones currently navigating. */
export function subscribeNavigationCount(listener: () => void): () => void {
  listeners.add(listener);
  getChannel("dashboard"); // join to receive presence; the dashboard never tracks itself
  return () => listeners.delete(listener);
}

export function getNavigationCount(): number {
  return count;
}
