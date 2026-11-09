"use client";

// How often each destination has been visited, read once when the home screen mounts.
// Not live on purpose: tiles reordering under someone's finger would cause mis-taps.
// Returns null until loaded (or if the read fails), so callers fall back to the default order.

import { useEffect, useState } from "react";
import { isDestId } from "@/lib/navconnect/destinations";
import type { DestId } from "@/lib/navconnect/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useDestinationCounts(): Partial<Record<DestId, number>> | null {
  const [counts, setCounts] = useState<Partial<Record<DestId, number>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getSupabaseBrowserClient()
      .from("destination_counts")
      .select("destination, count")
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const next: Partial<Record<DestId, number>> = {};
        for (const row of data) if (isDestId(row.destination)) next[row.destination] = row.count;
        setCounts(next);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return counts;
}
