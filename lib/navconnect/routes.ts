// Routes from the main entrance to each destination, plus demo detours around closures.
// Pure functions: the active closures are passed in.

import type {
  ClosureKey,
  ClosureState,
  DestId,
  Pace,
  Point,
  Route,
  StepAction,
} from "./types";

/** Main entrance (Hospital Court), main lobby, and the A Wing hallway junction. */
export const ENTRANCE: Point = [790, 458];
const LOBBY: Point = [775, 505];
const A_HALL: Point = [775, 645];

export const CLOSURE_AFFECTS: Record<ClosureKey, readonly DestId[]> = {
  cElev: ["card", "dial"],
  aWing: ["img"],
};

export const CLOSURE_KEYS = Object.keys(CLOSURE_AFFECTS) as ClosureKey[];

export const NO_CLOSURES: ClosureState = { cElev: false, aWing: false };

export function isClosureKey(value: unknown): value is ClosureKey {
  return typeof value === "string" && value in CLOSURE_AFFECTS;
}

export function baseRoute(id: DestId): Route {
  switch (id) {
    case "pharm":
      return {
        path: [ENTRANCE, LOBBY, [740, 515]],
        steps: [
          { m: 15, a: "straight", lm: "revolving" },
          { m: 15, a: "arrive", side: "signs" },
        ],
      };
    case "img":
      return {
        path: [ENTRANCE, LOBBY, A_HALL, [600, 645], [455, 650]],
        steps: [
          { m: 15, a: "straight", lm: "revolving" },
          { m: 55, a: "right", lm: "aWing" },
          { m: 45, a: "straight", lm: "coffee" },
          { m: 35, a: "straight", lm: "gElev" },
          { m: 25, a: "arrive", side: "end" },
        ],
      };
    case "nuc":
      return {
        path: [ENTRANCE, [735, 470], [640, 420], [520, 395], [390, 395]],
        steps: [
          { m: 15, a: "straight", lm: "revolving" },
          { m: 30, a: "straight", lm: "gift" },
          { m: 75, a: "arrive", side: "left" },
        ],
      };
    case "mri":
      return {
        path: [ENTRANCE, LOBBY, [790, 560]],
        steps: [
          { m: 15, a: "straight", lm: "revolving" },
          { m: 25, a: "down", f: "B1" },
          { m: 40, a: "arrive", side: "signs", fl: "B1" },
        ],
      };
    case "breast":
      return {
        path: [ENTRANCE, LOBBY, [790, 560]],
        steps: [
          { m: 15, a: "straight", lm: "revolving" },
          { m: 25, a: "down", f: "B1" },
          { m: 45, a: "arrive", side: "signs", fl: "B1" },
        ],
      };
    case "cancer":
      return {
        path: [ENTRANCE, LOBBY, A_HALL, [860, 645], [880, 700]],
        steps: [
          { m: 15, a: "straight", lm: "revolving" },
          { m: 55, a: "left", lm: "aWing" },
          { m: 20, a: "arrive", side: "ahead" },
        ],
      };
    case "card":
      return {
        path: [ENTRANCE, LOBBY, A_HALL, [893, 645]],
        steps: [
          { m: 15, a: "straight", lm: "revolving" },
          { m: 55, a: "left", lm: "aWing" },
          { m: 35, a: "straight", lm: "cancer" },
          { m: 20, a: "elev", el: "purple", f: 7 },
          { m: 15, a: "arrive", side: "left", fl: 7 },
        ],
      };
    case "dial":
      return {
        path: [ENTRANCE, LOBBY, A_HALL, [893, 645]],
        steps: [
          { m: 15, a: "straight", lm: "revolving" },
          { m: 55, a: "left", lm: "aWing" },
          { m: 35, a: "straight", lm: "cancer" },
          { m: 20, a: "elev", el: "purple", f: 8 },
          { m: 15, a: "arrive", side: "right", fl: 8 },
        ],
      };
  }
}

/** The demo detour around closure `k`, or null if none is confirmed for this destination. */
export function detourRoute(id: DestId, k: ClosureKey): Route | null {
  if (k === "cElev" && (id === "card" || id === "dial")) {
    const f = id === "card" ? 7 : 8;
    return {
      detourFor: k,
      path: [ENTRANCE, LOBBY, A_HALL, [843, 645]],
      steps: [
        { m: 15, a: "straight", lm: "revolving" },
        { m: 55, a: "left", lm: "aWing" },
        { m: 10, a: "elev", el: "grey", f },
        { m: 60, a: "straight", lm: "cWing", fl: f },
        { m: 15, a: "arrive", side: id === "card" ? "left" : "right", fl: f },
      ],
    };
  }
  if (k === "aWing" && id === "img") {
    return {
      detourFor: k,
      path: [ENTRANCE, [735, 480], [640, 505], [630, 600], [560, 640], [455, 650]],
      steps: [
        { m: 15, a: "straight", lm: "revolving" },
        { m: 35, a: "right", lm: "food" },
        { m: 60, a: "left", lm: "yellow" },
        { m: 55, a: "right", lm: "gWing" },
        { m: 40, a: "arrive", side: "ahead" },
      ],
    };
  }
  return null;
}

/** The active closure on the route to `id`, if any. */
export function closedFor(id: DestId, closures: ClosureState): ClosureKey | undefined {
  return CLOSURE_KEYS.find((k) => closures[k] && CLOSURE_AFFECTS[k].includes(id));
}

/** The route to show: a detour if a closure applies and one exists, otherwise the base route. */
export function getRoute(id: DestId, closures: ClosureState, allowDetour = true): Route {
  const k = closedFor(id, closures);
  return (allowDetour && k && detourRoute(id, k)) || baseRoute(id);
}

/** Walking speed in metres per second. */
export function walkSpeed(pace: Pace): number {
  return pace === "s" ? 0.75 : 1.1;
}

/** Total distance (m) and estimated minutes, including time for elevators or escalators. */
export function stats(r: Route, pace: Pace): { d: number; min: number } {
  const d = r.steps.reduce((a, s) => a + s.m, 0);
  const v = r.steps.some((s) => s.a === "elev")
    ? 60
    : r.steps.some((s) => s.a === "down")
      ? 40
      : 0;
  return { d, min: Math.max(1, Math.round((d / walkSpeed(pace) + v) / 60)) };
}

/** The floor the visitor is on while at step `i`: wherever the last elevator or escalator took them. */
export function floorAt(r: Route, i: number): "main" | number | "B1" {
  let floor: "main" | number | "B1" = "main";
  for (const s of r.steps.slice(0, i)) {
    if ((s.a === "elev" || s.a === "down") && s.f !== undefined) floor = s.f;
  }
  return floor;
}

/** Icon shown for each kind of step. */
export const SICON = {
  straight: "up",
  left: "left",
  right: "right",
  elev: "elev",
  down: "down",
  arrive: "pin",
} as const satisfies Record<StepAction, string>;
