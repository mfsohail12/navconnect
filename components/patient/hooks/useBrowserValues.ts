"use client";

// Small browser-only values, read without setState-in-effect and without hydration mismatches.

import { useSyncExternalStore } from "react";
import { getClientId } from "@/lib/supabase/utils";

const noopSubscribe = () => () => {};

/** This device's anonymous id, or null during server render and hydration. */
export function useClientId(): string | null {
  return useSyncExternalStore(noopSubscribe, getClientId, () => null);
}

function clockText(): string {
  return new Date()
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .replace(/\s?[AP]M/i, "");
}

function subscribeClock(cb: () => void): () => void {
  const t = setInterval(cb, 30_000);
  return () => clearInterval(t);
}

/** Status-bar clock (h:mm), updated every 30 s. Shows "9:41" until hydrated. */
export function useClock(): string {
  return useSyncExternalStore(subscribeClock, clockText, () => "9:41");
}
