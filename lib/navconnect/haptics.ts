// Vibration cues, using the device's vibration motor only.
// navigator.vibrate works on Android browsers. iOS (Safari and home-screen apps) doesn't
// support it, so cues silently do nothing there. There is deliberately no on-screen stand-in.

export type HapticKind = "left" | "right" | "elev" | "down" | "arrive" | "reroute";

/** navigator.vibrate patterns in ms (on, off, on, …), from the prototype. */
export const HAP: Record<HapticKind, readonly number[]> = {
  left: [140, 90, 140], // 2 short
  right: [140, 90, 140, 90, 140], // 3 short
  elev: [400, 150, 400], // 2 long
  down: [400, 150, 400], // 2 long
  arrive: [700], // 1 long
  reroute: [80, 60, 80, 60, 80, 60, 80], // 4 quick
};

/** Whether this browser exposes the Vibration API (false on iOS). */
export function vibrationSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Vibrate the device if it supports it; otherwise do nothing. */
export function vibrate(kind: HapticKind): void {
  if (!vibrationSupported()) return;
  try {
    navigator.vibrate([...HAP[kind]]);
  } catch {
    // Some browsers throw if called without a user gesture; ignore.
  }
}
