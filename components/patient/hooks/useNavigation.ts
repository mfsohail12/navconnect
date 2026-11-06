"use client";

// The simulated walk, ported from the prototype's startNav / step / maneuver / advance / finish.
// Walking ticks every 100 ms and counts down the metres left on the current step. At zero the
// step's maneuver runs: a turn pans the AR scene, an elevator or escalator shows the riding
// overlay, and the arrive step finishes the route.
//
// Timers and event handlers read the live state from `navRef` and write it with `commit()`,
// so they never act on a stale render.

import { useCallback, useEffect, useRef, useState } from "react";
import type { HapticKind } from "@/lib/navconnect/haptics";
import { I, fill, instr, type LandmarkId } from "@/lib/navconnect/i18n";
import { stats } from "@/lib/navconnect/routes";
import type { DestId, ElevatorName, LangCode, Pace, Route } from "@/lib/navconnect/types";
import { useLatest } from "./useLatest";

export type Floor = "main" | number | "B1";

export type NavState = {
  route: Route;
  /** Index of the current step. */
  i: number;
  /** Metres left on the current step. */
  left: number;
  walking: boolean;
  floor: Floor;
  riding: boolean;
};

export type Ride = {
  kind: "elev" | "down";
  el?: ElevatorName;
  /** Floor number shown in the riding overlay. */
  fl: string;
};

type Options = {
  dest: DestId | null;
  lang: LangCode;
  pace: Pace;
  speak: (text: string, force?: boolean) => void;
  haptic: (kind: HapticKind) => void;
  /** Called on arrival with the (simulated) walking time in seconds. */
  onFinish: (dest: DestId, seconds: number) => void;
};

/** Metres per second of simulated walking (faster than real life, for the demo). */
const SIM_SPEED: Record<Pace, number> = { n: 4.6, s: 3.2 };

export function useNavigation(options: Options) {
  const [nav, setNav] = useState<NavState | null>(null);
  const [ride, setRide] = useState<Ride | null>(null);
  const [pan, setPan] = useState<"left" | "right" | null>(null);
  const navRef = useRef<NavState | null>(null);
  const opts = useLatest(options);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const commit = useCallback((next: NavState | null) => {
    navRef.current = next;
    setNav(next);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** Speak the current step: "In about 40 metres, turn left at …". */
  const announce = useCallback((force = false) => {
    const n = navRef.current;
    const { dest, lang, speak } = opts.current;
    if (!n || !dest) return;
    const s = n.route.steps[n.i];
    speak(
      (s.a === "arrive" ? "" : fill(I[lang].inM, { m: Math.ceil(n.left) })) +
        instr(s, dest, lang),
      force,
    );
  }, [opts]);

  const advance = useCallback(() => {
    const n = navRef.current;
    if (!n || n.i + 1 >= n.route.steps.length) return;
    const i = n.i + 1;
    commit({ ...n, i, left: n.route.steps[i].m });
    announce();
  }, [announce, commit]);

  const finish = useCallback(() => {
    const n = navRef.current;
    const { dest, pace, onFinish } = opts.current;
    if (!n || !dest) return;
    const seconds = Math.round(stats(n.route, pace).min * 60 * (0.85 + Math.random() * 0.3));
    clearTimers();
    setRide(null);
    setPan(null);
    commit(null);
    onFinish(dest, seconds);
  }, [clearTimers, commit, opts]);

  const maneuver = useCallback(() => {
    const n = navRef.current;
    if (!n) return;
    const s = n.route.steps[n.i];
    const { haptic } = opts.current;

    if (s.a === "arrive") {
      haptic("arrive");
      finish();
      return;
    }
    // Going straight has no vibration cue (the prototype's HAP has no "straight" entry).
    if (s.a !== "straight") haptic(s.a);

    if (s.a === "left" || s.a === "right") {
      const dir = s.a;
      setPan(dir);
      later(() => setPan((p) => (p === dir ? null : p)), 650);
    }

    if (s.a === "elev" || s.a === "down") {
      commit({ ...n, left: 0, riding: true });
      setRide({ kind: s.a, el: s.el, fl: s.a === "elev" ? "1" : "G" });
      later(() => setRide((r) => r && { ...r, fl: String(s.f) }), 1100);
      later(() => {
        setRide(null);
        const m = navRef.current;
        if (!m) return;
        commit({ ...m, floor: s.f ?? m.floor, riding: false });
        advance();
      }, 2300);
      return;
    }

    advance();
  }, [advance, commit, finish, later, opts]);

  // Walking loop.
  const active = nav !== null;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const n = navRef.current;
      if (!n || !n.walking || n.riding) return;
      const left = n.left - SIM_SPEED[opts.current.pace] * 0.1;
      if (left <= 0) {
        commit({ ...n, left: 0 });
        maneuver();
      } else {
        commit({ ...n, left });
      }
    }, 100);
    return () => clearInterval(id);
  }, [active, commit, maneuver, opts]);

  /** Begin a route. The first instruction is spoken shortly after. */
  const start = useCallback(
    (route: Route) => {
      clearTimers();
      setRide(null);
      setPan(null);
      commit({ route, i: 0, left: route.steps[0].m, walking: false, floor: "main", riding: false });
      later(() => announce(), 250);
    },
    [announce, clearTimers, commit, later],
  );

  /** Switch to a new route from the start (used for detours). */
  const reroute = useCallback(
    (route: Route) => {
      const n = navRef.current;
      if (!n) return;
      commit({ ...n, route, i: 0, left: route.steps[0].m, floor: "main" });
    },
    [commit],
  );

  const toggleWalk = useCallback(() => {
    const n = navRef.current;
    if (n) commit({ ...n, walking: !n.walking });
  }, [commit]);

  const pause = useCallback(() => {
    const n = navRef.current;
    if (n?.walking) commit({ ...n, walking: false });
  }, [commit]);

  /** Jump to the end of the current step. */
  const skip = useCallback(() => {
    const n = navRef.current;
    if (!n || n.riding) return;
    commit({ ...n, left: 0 });
    maneuver();
  }, [commit, maneuver]);

  const end = useCallback(() => {
    clearTimers();
    setRide(null);
    setPan(null);
    commit(null);
  }, [clearTimers, commit]);

  /** The live navigation state, for event handlers (not for rendering). */
  const current = useCallback(() => navRef.current, []);

  /** The landmark the visitor is at or heading to, for help requests. */
  const currentLandmark = useCallback((): LandmarkId => {
    const n = navRef.current;
    if (!n) return "start";
    const s = n.route.steps[n.i];
    const lm = s.lm || (n.i > 0 ? n.route.steps[n.i - 1].lm : "start") || "start";
    return lm as LandmarkId;
  }, []);

  return {
    nav,
    ride,
    pan,
    start,
    reroute,
    toggleWalk,
    pause,
    skip,
    end,
    announce,
    current,
    currentLandmark,
  };
}

export type Navigation = ReturnType<typeof useNavigation>;
