// Staff dashboard data and the wording of request and activity messages.
// The dashboard is English-only, like the prototype's console.
// Safe to import from both Server Actions and Client Components.

import { I, isLangCode } from "./i18n";
import { isDestId } from "./destinations";
import { isClosureKey } from "./routes";
import type { ClosureKey, DestId, HelpReason } from "./types";

/** Volunteers handed out in rotation when staff click "Assign volunteer". */
export const VOLS = ["Fatima K.", "Mei L.", "Joseph A.", "Priya S."] as const;

/** Everyone on shift: the rotation above plus the volunteer already helping in the seeded data. */
export const VOLUNTEER_ROSTER: readonly string[] = [...VOLS, "Daniel O."];

/** Help sheet reasons, in the same order as each dictionary's `reasons` list. */
export const HELP_REASONS = ["lost", "wheelchair", "interpreter", "other"] as const satisfies readonly HelpReason[];

export const CLOSURE_NAMES: Record<ClosureKey, string> = {
  cElev: "Purple Elevator (C Wing)",
  aWing: "A Wing hallway",
};

/** Detour descriptions for the activity feed. */
const DETOUR_VIA: Record<ClosureKey, { around: string; via: string }> = {
  cElev: { around: "Purple Elevator", via: "via the Grey Elevator" },
  aWing: { around: "A Wing hallway", via: "via the Food Court and F Wing" },
};

/** Static language mix for the dashboard (percent of visitors). */
export const LANGUAGE_MIX: readonly { name: string; pct: number; color: string }[] = [
  { name: "English", pct: 71, color: "--l-blue" },
  { name: "French", pct: 8, color: "--l-teal" },
  { name: "Arabic", pct: 7, color: "--l-amber" },
  { name: "Mandarin", pct: 5, color: "--l-green" },
  { name: "Punjabi", pct: 4, color: "--l-red" },
  { name: "Other", pct: 5, color: "--muted" },
];

/** Hardcoded demo figure for the "total time saved" tile: hours saved today. */
export const TIME_SAVED_HOURS = 34.3;

const LANG_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic",
  zh: "Mandarin",
  pa: "Punjabi",
};

/** English name of a language code, for "prefers Arabic" style notes. */
export function languageName(lang: string): string {
  return LANG_NAMES[lang] ?? lang.toUpperCase();
}

/** Short language tag shown on a request, e.g. "EN", "AR", "ZH", "PA". */
export function langTag(lang: string): string {
  if (lang === "zh") return "ZH";
  return isLangCode(lang) ? I[lang].code : lang.toUpperCase();
}

export function destName(dest: string | null | undefined): string {
  return dest && isDestId(dest) ? I.en.dest[dest] : "their destination";
}

/** The subset of a help_requests row needed to describe it. */
export type RequestSummary = {
  reason: string;
  lang: string;
  note?: string | null;
  destination?: string | null;
  escort_for?: string | null;
};

/** One-line description of a help request, as shown on the dashboard. */
export function requestText(r: RequestSummary): string {
  if (r.reason === "escort") {
    const closure = r.escort_for && isClosureKey(r.escort_for) ? CLOSURE_NAMES[r.escort_for] : "Route";
    return `Escort needed: ${closure} closed, going to ${destName(r.destination)}`;
  }
  const i = (HELP_REASONS as readonly string[]).indexOf(r.reason);
  let text = i >= 0 ? I.en.reasons[i] : r.reason;
  if (r.note) text += ` · ${r.note}`;
  if (r.lang !== "en") text += ` · prefers ${languageName(r.lang)}`;
  return text;
}

export const activityMessages = {
  newRequest: (r: RequestSummary & { location: string }) =>
    `New request from a visitor: “${requestText(r)}” near ${r.location}.`,
  assigned: (r: RequestSummary & { location: string; volunteer: string }) =>
    `${r.volunteer} assigned: “${requestText(r)}” at ${r.location}.`,
  closure: (k: ClosureKey, closed: boolean) =>
    `${CLOSURE_NAMES[k]} ${closed ? "marked closed (demo scenario)." : "reopened."}`,
  detour: (k: ClosureKey, dest: DestId) =>
    `A visitor chose a detour around the ${DETOUR_VIA[k].around} to reach ${I.en.dest[dest]} (${DETOUR_VIA[k].via}).`,
  arrival: (dest: DestId, secs: number, lang: string) =>
    `A visitor arrived at ${I.en.dest[dest]} in ${Math.floor(secs / 60)} min ${secs % 60} s` +
    (lang !== "en" && isLangCode(lang) ? ` (navigating in ${I[lang].name})` : "") +
    ".",
};

/** "just now" / "4 min ago", as on the prototype console. */
export function minutesAgo(iso: string, now = Date.now()): string {
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  return m < 1 ? "just now" : `${m} min ago`;
}
