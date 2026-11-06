"use client";

import { useEffect, type RefObject } from "react";

/** Full-screen layout below this width (matches the media query in patient.module.css). */
const PHONE_LAYOUT_MAX = 500;
/** The framed phone's outer height (812 + 2 × 10px border) plus the page's 16px padding. */
const FRAME_HEIGHT = 832 + 32;

/**
 * On laptops, shrink the framed phone uniformly so it fits the window's height,
 * instead of squashing the screens inside it. On phones, the app is full screen.
 */
export function usePhoneFit(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      if (window.innerWidth <= PHONE_LAYOUT_MAX) {
        el.style.removeProperty("zoom");
        return;
      }
      const z = Math.min(1, window.innerHeight / FRAME_HEIGHT);
      el.style.setProperty("zoom", z < 1 ? z.toFixed(3) : "");
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref]);
}
