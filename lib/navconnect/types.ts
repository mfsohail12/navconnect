// Shared types for the static NavConnect data.

export type LangCode = "en" | "fr" | "ar" | "zh";

export type DestId =
  | "img"
  | "mri"
  | "nuc"
  | "breast"
  | "card"
  | "dial"
  | "cancer"
  | "pharm";

/** Closure keys, matching `closures.key` in the database. */
export type ClosureKey = "cElev" | "aWing";

/** Which closures are active. Built from the `closures` table on the client. */
export type ClosureState = Record<ClosureKey, boolean>;

/** Walking pace setting: normal or slower. */
export type Pace = "n" | "s";

export type StepAction = "straight" | "left" | "right" | "elev" | "down" | "arrive";

export type Side = "left" | "right" | "ahead" | "end" | "signs";

export type ElevatorName = "purple" | "grey";

/** A point on the floor map, in SVG coordinates. */
export type Point = readonly [number, number];

export type Step = {
  /** Distance in metres. */
  m: number;
  a: StepAction;
  /** Landmark id (see `LM_EN_PLAIN` and each dictionary's `lm`). */
  lm?: string;
  side?: Side;
  /** Floor reached by an elevator or escalator step. */
  f?: number | "B1";
  /** Floor this step happens on, if not the main floor. */
  fl?: number | "B1";
  el?: ElevatorName;
};

export type Route = {
  path: readonly Point[];
  steps: readonly Step[];
  /** Set when this is a detour around the given closure. */
  detourFor?: ClosureKey;
};

/** Help request reasons, matching the `help_requests.reason` check constraint. */
export type HelpReason = "lost" | "wheelchair" | "interpreter" | "other" | "escort";
