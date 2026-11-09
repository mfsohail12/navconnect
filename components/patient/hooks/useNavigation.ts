"use client";

// Step-by-step navigation, driven by the presenter. "Start" narrates the first step, then
// "Continue" moves to the next step and "Back" returns to the previous one. The last
// (arrive) step finishes the route.
//
// Event handlers read the live state from `navRef` and write it with `commit()`, so they
// never act on a stale render.

import { useCallback, useRef, useState } from "react";
import type { HapticKind } from "@/lib/navconnect/haptics";
import { I, fill, instr, type LandmarkId } from "@/lib/navconnect/i18n";
import { stats } from "@/lib/navconnect/routes";
import type { DestId, LangCode, Pace, Route } from "@/lib/navconnect/types";
import { useLatest } from "./useLatest";

export type NavState = {
  route: Route;
  /** Index of the current step. */
  i: number;
  /** False until the presenter taps Start (which narrates the first step). */
  started: boolean;
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

export function useNavigation(options: Options) {
  const [nav, setNav] = useState<NavState | null>(null);
  const navRef = useRef<NavState | null>(null);
  const opts = useLatest(options);

  const commit = useCallback((next: NavState | null) => {
    navRef.current = next;
    setNav(next);
  }, []);

  /** Speak the current step: "In about 40 metres, turn left at …". */
  const announce = useCallback(
    (force = false) => {
      const n = navRef.current;
      const { dest, lang, speak } = opts.current;
      if (!n || !dest) return;
      const s = n.route.steps[n.i];
      speak(
        (s.a === "arrive" ? "" : fill(I[lang].inM, { m: Math.ceil(s.m) })) + instr(s, dest, lang),
        force,
      );
    },
    [opts],
  );

  /** Show step `i`: vibrate for its maneuver (none for going straight or arriving) and speak it. */
  const goTo = useCallback(
    (i: number) => {
      const n = navRef.current;
      if (!n) return;
      commit({ ...n, i });
      const a = n.route.steps[i].a;
      if (a !== "straight" && a !== "arrive") opts.current.haptic(a);
      announce();
    },
    [announce, commit, opts],
  );

  const finish = useCallback(() => {
    const n = navRef.current;
    const { dest, pace, haptic, onFinish } = opts.current;
    if (!n || !dest) return;
    const seconds = Math.round(stats(n.route, pace).min * 60 * (0.85 + Math.random() * 0.3));
    haptic("arrive");
    commit(null);
    onFinish(dest, seconds);
  }, [commit, opts]);

  /** Begin a route. Step 1 is shown straight away; it's spoken when the presenter taps Start. */
  const start = useCallback(
    (route: Route) => {
      commit({ route, i: 0, started: false });
    },
    [commit],
  );

  /** Switch to a new route from the first step (used for detours). */
  const reroute = useCallback(
    (route: Route) => {
      const n = navRef.current;
      if (!n) return;
      commit({ ...n, route, i: 0 });
    },
    [commit],
  );

  /** Start → Continue → Finish. */
  const next = useCallback(() => {
    const n = navRef.current;
    if (!n) return;

    if (!n.started) {
      commit({ ...n, started: true });
      announce();
      return;
    }

    const s = n.route.steps[n.i];
    if (s.a === "arrive") {
      finish();
      return;
    }

    goTo(n.i + 1);
  }, [announce, commit, finish, goTo]);

  /** Return to the previous step. */
  const back = useCallback(() => {
    const n = navRef.current;
    if (!n || !n.started || n.i === 0) return;
    commit({ ...n, i: n.i - 1 });
    announce();
  }, [announce, commit]);

  const end = useCallback(() => {
    commit(null);
  }, [commit]);

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
    start,
    reroute,
    next,
    back,
    end,
    announce,
    current,
    currentLandmark,
  };
}

export type Navigation = ReturnType<typeof useNavigation>;
