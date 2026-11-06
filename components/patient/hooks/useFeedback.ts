"use client";

// Spoken directions and vibration cues, honouring the user's settings.
// Vibration uses the device motor only (Android); where unsupported (iOS) it does nothing.

import { useCallback, useEffect, useRef, useState } from "react";
import { vibrate, type HapticKind } from "@/lib/navconnect/haptics";
import { speak as speakText, speechSupported, stopSpeaking } from "@/lib/navconnect/speech";
import type { Prefs } from "./usePrefs";
import { useLatest } from "./useLatest";

export type Feedback = {
  /** `force` skips the settings check (e.g. right after the user turns the setting on). */
  speak: (text: string, force?: boolean) => void;
  stop: () => void;
  haptic: (kind: HapticKind, force?: boolean) => void;
  /** True while speech is playing (animates the Voice control). */
  speaking: boolean;
};

export function useFeedback(prefs: Prefs): Feedback {
  const [speaking, setSpeaking] = useState(false);
  const prefsRef = useLatest(prefs);
  const speakTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Some browsers load voices lazily; ask early so the first instruction has one.
    try {
      if (speechSupported()) window.speechSynthesis.getVoices();
    } catch {
      // ignore
    }
    return () => clearTimeout(speakTimer.current);
  }, []);

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
      if (prefsRef.current.haptic || force) vibrate(kind);
    },
    [prefsRef],
  );

  return { speak, stop, haptic, speaking };
}
