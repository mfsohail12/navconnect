"use client";

import { useEffect, useRef, type RefObject } from "react";

/** A ref that always holds the latest value, for use in timers and event callbacks. */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
