"use client";

// How often each destination has been visited, refreshed whenever the home screen mounts.
// Not live on purpose: tiles reordering under someone's finger would cause mis-taps.
//
// The last result is kept at module level, so coming back to the home screen starts in the
// right order straight away instead of showing the default order and then re-sorting.
// `settled` is false only until the very first read finishes (or fails), so the caller can
// hold the grid back rather than show it in the wrong order.

import { useEffect, useState } from "react";
import { isDestId } from "@/lib/navconnect/destinations";
import type { DestId } from "@/lib/navconnect/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Counts = Partial<Record<DestId, number>>;

let cached: Counts | null = null;

export function useDestinationCounts(): { counts: Counts; settled: boolean } {
  const [counts, setCounts] = useState<Counts | null>(cached);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSupabaseBrowserClient()
      .from("destination_counts")
      .select("destination, count")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setFailed(true);
          return;
        }
        const next: Counts = {};
        for (const row of data) if (isDestId(row.destination)) next[row.destination] = row.count;
        cached = next;
        setCounts(next);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { counts: counts ?? {}, settled: counts !== null || failed };
}
