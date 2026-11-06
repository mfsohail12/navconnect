"use client";

// Spoken directions and vibration cues, honouring the user's settings.
// Vibration only works on Android, so every cue also shakes the phone frame on screen
// and shows the haptic toast, as in the prototype.

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { HAP, pulseInterval, vibrate, type HapticKind } from "@/lib/navconnect/haptics";
import { speak as speakText, stopSpeaking } from "@/lib/navconnect/speech";
import { cx } from "../cx";
import type { Prefs } from "./usePrefs";
import { useLatest } from "./useLatest";

export type Feedback = {
  /** `force` skips the settings check (e.g. right after the user turns the setting on). */
  speak: (text: string, force?: boolean) => void;
  stop: () => void;
  haptic: (kind: HapticKind, force?: boolean) => void;
  /** True while speech is playing (animates the Voice control). */
  speaking: boolean;
  /** Glyphs for the haptic toast, or null when hidden. */
  toast: string | null;
};

export function useFeedback(prefs: Prefs, phoneRef: RefObject<HTMLElement | null>): Feedback {
  const [speaking, setSpeaking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const prefsRef = useLatest(prefs);
  const speakTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pulseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(speakTimer.current);
      clearTimeout(toastTimer.current);
      clearTimeout(pulseTimer.current);
    },
    [],
  );

  const speak = useCallback(
    (text: string, force = false) => {
      const p = prefsRef.current;
      if ((!p.audio && !force) || !text) return;
      const done = () => setSpeaking(false);
      if (!speakText(text, { lang: p.lang, pace: p.pace, onEnd: done })) return;
      setSpeaking(true);
      clearTimeout(speakTimer.current);
      speakTimer.current = setTimeout(done, 6000);
    },
    [prefsRef],
  );

  const stop = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, []);

  const haptic = useCallback(
    (kind: HapticKind, force = false) => {
      if (!prefsRef.current.haptic && !force) return;
      const h = vibrate(kind);

      // On-screen shake: restart the buzz animation once per pulse.
      const phone = phoneRef.current;
      const buzz = cx("buzz");
      let i = 0;
      clearTimeout(pulseTimer.current);
      const pulse = () => {
        if (!phone || i++ >= h.n) return;
        phone.classList.remove(buzz);
        void phone.offsetWidth; // force reflow so the animation restarts
        phone.classList.add(buzz);
        pulseTimer.current = setTimeout(pulse, pulseInterval(kind));
      };
      pulse();

      setToast(HAP[kind].d);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 1800);
    },
    [prefsRef, phoneRef],
  );

  return { speak, stop, haptic, speaking, toast };
}
