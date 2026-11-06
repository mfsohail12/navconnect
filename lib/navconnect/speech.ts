// Spoken directions via the Web Speech API.
// iOS Safari only speaks after a user gesture, so never call speak() on page load.

import { I } from "./i18n";
import type { LangCode, Pace } from "./types";

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export type SpeakOptions = {
  lang: LangCode;
  pace?: Pace;
  /** Called when speech ends or fails (e.g. to clear a "speaking" indicator). */
  onEnd?: () => void;
};

/**
 * Speak `text`, cancelling anything already being spoken.
 * Returns false if speech isn't available. Callers check the user's voice setting first.
 */
export function speak(text: string, { lang, pace = "n", onEnd }: SpeakOptions): boolean {
  if (!speechSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = I[lang].voice;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang && v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    u.rate = pace === "s" ? 0.9 : 1;
    if (onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  try {
    if (speechSupported()) window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
