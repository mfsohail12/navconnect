// Lakeridge Health Oshawa destinations (locations from lh.ca visitor directions).

import { I } from "./i18n";
import type { DestId, LangCode } from "./types";
import type { IconName } from "./icons";

/** Wayfinding line colour; maps to the `--l-<line>` CSS token. */
export type LineColor = "amber" | "green" | "teal" | "red" | "blue";

export type Destination = {
  icon: IconName;
  line: LineColor;
  /** Shown on the arrival screen as the location. */
  loc: string;
};

export const DEST: Record<DestId, Destination> = {
  img: { icon: "scan", line: "amber", loc: "A Wing" },
  mri: { icon: "magnet", line: "green", loc: "N Wing · B1" },
  nuc: { icon: "atom", line: "green", loc: "N Wing" },
  breast: { icon: "scan", line: "green", loc: "N Wing · B1" },
  card: { icon: "heart", line: "teal", loc: "C Wing · 7" },
  dial: { icon: "drop", line: "teal", loc: "C Wing · 8" },
  cancer: { icon: "ribbon", line: "red", loc: "Main floor" },
  pharm: { icon: "pill", line: "blue", loc: "Main lobby" },
};

/** Display order on the home grid. */
export const ORDER = Object.keys(DEST) as DestId[];

/** Extra search keywords (English and French). */
export const KW: Record<DestId, string> = {
  img: "diagnostic x-ray xray ct ultrasound radiology imaging interventional imagerie",
  mri: "mri magnetic irm",
  nuc: "nuclear pet bone density",
  breast: "mammogram mammography breast sein",
  card: "heart cardiac cardiology coeur",
  dial: "dialysis kidney renal rein",
  cancer: "cancer oncology chemotherapy radiation mclaughlin",
  pharm: "pharmacy prescription medication",
};

export function isDestId(value: unknown): value is DestId {
  return typeof value === "string" && value in DEST;
}

/** Home-screen search: matches the current-language name, English name and sub, and keywords. */
export function searchDestinations(query: string, lang: LangCode): DestId[] {
  const q = query.trim().toLowerCase();
  if (!q) return ORDER;
  return ORDER.filter((id) =>
    `${I[lang].dest[id]} ${I.en.dest[id]} ${I.en.subs[id]} ${KW[id]}`
      .toLowerCase()
      .includes(q),
  );
}
