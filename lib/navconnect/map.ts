// Main-floor map geometry, traced from the Lakeridge Health Oshawa site map.
// Coordinates are in the SVG user space of MAP_VIEWBOX. Drawn by <FloorMap> (Phase 2),
// which mirrors the prototype's mapSVG(): wings, wing badges, labels, elevators,
// closure markers, the animated route line, the "you are here" pulse and the destination pin.

import type { ClosureKey, DestId, Point } from "./types";

export const MAP_VIEWBOX = "270 222 975 600";
export const MAP_ARIA_LABEL =
  "Main floor map of Lakeridge Health Oshawa, traced from the hospital site map";

export type Wing = {
  letter: string;
  color: string;
  polygon: readonly Point[];
  /** Where the wing's letter badge sits. */
  badge: Point;
};

export const WINGS: readonly Wing[] = [
  {
    letter: "N",
    color: "#3FBF2E",
    polygon: [[288, 282], [300, 268], [692, 268], [692, 405], [680, 418], [522, 418], [522, 515], [288, 515]],
    badge: [430, 370],
  },
  {
    letter: "F",
    color: "#F2E36B",
    polygon: [[522, 418], [680, 418], [662, 468], [662, 612], [628, 630], [522, 620]],
    badge: [570, 575],
  },
  {
    letter: "A",
    color: "#F28A1A",
    polygon: [
      [680, 418], [712, 400], [742, 442], [790, 455], [815, 420], [815, 612],
      [850, 628], [855, 785], [645, 785], [628, 630], [662, 612], [662, 468],
    ],
    badge: [748, 700],
  },
  {
    letter: "D",
    color: "#8A8D90",
    polygon: [[815, 418], [925, 418], [925, 612], [815, 612]],
    badge: [868, 548],
  },
  {
    letter: "G",
    color: "#1EB8EE",
    polygon: [[288, 515], [522, 515], [522, 620], [628, 630], [645, 785], [288, 775]],
    badge: [428, 697],
  },
  {
    letter: "C",
    color: "#4A2BE0",
    polygon: [
      [855, 615], [945, 615], [945, 598], [1135, 598], [1135, 622], [1200, 622],
      [1220, 700], [1205, 785], [935, 790], [900, 808], [885, 790], [855, 785],
    ],
    badge: [1015, 710],
  },
  {
    letter: "U",
    color: "#E8221F",
    polygon: [[1150, 553], [1185, 553], [1185, 503], [1240, 503], [1240, 622], [1135, 622], [1135, 598], [1150, 598]],
    badge: [1205, 565],
  },
];

export type Elevator = { name: string; color: string; at: Point };

export const ELEVS: readonly Elevator[] = [
  { name: "Silver", color: "#A7AEB5", at: [440, 448] },
  { name: "Green", color: "#2E9E3E", at: [633, 395] },
  { name: "Yellow", color: "#E2C93B", at: [643, 595] },
  { name: "Orange", color: "#F28A1A", at: [767, 567] },
  { name: "Grey", color: "#8A8D90", at: [843, 636] },
  { name: "Purple", color: "#5B3BE8", at: [893, 645] },
  { name: "Blue", color: "#1EB8EE", at: [588, 645] },
];

/** Fixed, untranslated place labels (street-side courts). */
export const COURT_LABELS: readonly { text: string; at: Point }[] = [
  { text: "Hospital Court", at: [990, 330] },
  { text: "Parkwood Court", at: [1060, 815] },
];

/** Positions of the translated labels (text comes from the dictionary's `mapL`). */
export const MAP_LABELS = {
  food: [742, 532] as Point,
  /** Centre of the red "Emergency" tag. */
  er: [470, 250] as Point,
};

/** How each closure is drawn: an optional dashed blocked segment and an ✕ marker. */
export const CLOSURE_MARKS: Record<
  ClosureKey,
  { line?: readonly [Point, Point]; x: Point; size: number }
> = {
  aWing: { line: [[760, 645], [610, 645]], x: [690, 645], size: 26 },
  cElev: { x: [893, 645], size: 30 },
};

export type HeatSpot = {
  at: Point;
  /** Short name drawn on the map (the tooltip shows the full name). */
  short: string;
  /** Which side of the dot the name label sits on. */
  label: "left" | "right" | "above" | "below";
};

/**
 * Where each destination sits on the staff heatmap. Roughly the route end points, nudged apart
 * where destinations share one (MRI / Breast, Cardiology / Dialysis) and clear of the wing badges.
 */
export const HEAT_SPOTS: Record<DestId, HeatSpot> = {
  img: { at: [440, 630], short: "Imaging", label: "right" },
  mri: { at: [775, 585], short: "MRI", label: "below" },
  nuc: { at: [370, 485], short: "Nuclear Med", label: "right" },
  breast: { at: [845, 600], short: "Breast", label: "right" },
  card: { at: [925, 662], short: "Cardiology", label: "right" },
  dial: { at: [925, 626], short: "Dialysis", label: "right" },
  cancer: { at: [880, 755], short: "Cancer Centre", label: "left" },
  pharm: { at: [735, 500], short: "Pharmacy", label: "left" },
};
