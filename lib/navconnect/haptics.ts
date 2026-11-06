// Vibration cues. navigator.vibrate only works on Android, so the UI always also shows
// the prototype's on-screen shake (`n` pulses) and the haptic toast (`d` glyphs).

export type HapticKind = "left" | "right" | "elev" | "down" | "arrive" | "reroute";

export type HapticPattern = {
  /** navigator.vibrate pattern in ms (on, off, on, …). */
  p: readonly number[];
  /** Glyphs shown in the haptic toast. */
  d: string;
  /** Number of on-screen shake pulses. */
  n: number;
};

export const HAP: Record<HapticKind, HapticPattern> = {
  left: { p: [140, 90, 140], d: "● ●", n: 2 },
  right: { p: [140, 90, 140, 90, 140], d: "● ● ●", n: 3 },
  elev: { p: [400, 150, 400], d: "━ ━", n: 2 },
  down: { p: [400, 150, 400], d: "━ ━", n: 2 },
  arrive: { p: [700], d: "━━━", n: 1 },
  reroute: { p: [80, 60, 80, 60, 80, 60, 80], d: "● ● ● ●", n: 4 },
};

export function isHapticKind(value: string): value is HapticKind {
  return value in HAP;
}

/** Milliseconds between on-screen shake pulses for a pattern. */
export function pulseInterval(kind: HapticKind): number {
  return HAP[kind].p[0] > 300 ? 420 : 220;
}

/** Vibrate the device if supported. Returns the pattern so the UI can show the shake and toast. */
export function vibrate(kind: HapticKind): HapticPattern {
  const h = HAP[kind];
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([...h.p]);
    }
  } catch {
    // ignore
  }
  return h;
}
