"use client";

// Per-device accessibility settings, stored in localStorage (as in the prototype).
// useSyncExternalStore renders the defaults on the server and during hydration,
// then the stored values, so there's no hydration mismatch.

import { useSyncExternalStore } from "react";
import { isLangCode } from "@/lib/navconnect/i18n";
import type { LangCode, Pace } from "@/lib/navconnect/types";

export type TextScale = 1 | 1.15 | 1.3;
export const TEXT_SCALES: readonly TextScale[] = [1, 1.15, 1.3];

export type Prefs = {
  lang: LangCode;
  audio: boolean;
  haptic: boolean;
  scale: TextScale;
  hc: boolean;
  pace: Pace;
};

const KEY = "navconnect-prefs";

export const DEFAULT_PREFS: Prefs = {
  lang: "en",
  audio: true,
  haptic: true,
  scale: 1,
  hc: false,
  pace: "n",
};

let cache: Prefs | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): Prefs {
  const p = { ...DEFAULT_PREFS };
  if (!raw) return p;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof Prefs, unknown>>;
    if (isLangCode(v.lang)) p.lang = v.lang;
    if (typeof v.audio === "boolean") p.audio = v.audio;
    if (typeof v.haptic === "boolean") p.haptic = v.haptic;
    if (TEXT_SCALES.includes(v.scale as TextScale)) p.scale = v.scale as TextScale;
    if (typeof v.hc === "boolean") p.hc = v.hc;
    if (v.pace === "n" || v.pace === "s") p.pace = v.pace;
  } catch {
    // Corrupt value: fall back to defaults.
  }
  return p;
}

function getSnapshot(): Prefs {
  if (!cache) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch {
      // Storage blocked (some private modes): use defaults in memory.
    }
    cache = parse(raw);
  }
  return cache;
}

function getServerSnapshot(): Prefs {
  return DEFAULT_PREFS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setPrefs(patch: Partial<Prefs>): void {
  cache = { ...getSnapshot(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Keep the in-memory value.
  }
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
