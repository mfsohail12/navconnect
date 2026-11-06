"use client";

// Live closure state for the patient app, from the `closures` table.

import { useCallback, useRef, useState } from "react";
import { CLOSURE_KEYS, NO_CLOSURES, isClosureKey } from "@/lib/navconnect/routes";
import type { ClosureKey, ClosureState } from "@/lib/navconnect/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTableChanges } from "@/lib/supabase/use-table-changes";
import { unwrap } from "@/lib/supabase/utils";
import { useLatest } from "./useLatest";

/**
 * Returns which closures are active. `onClosed(key)` fires when a closure goes from
 * open to closed, whether the change arrives live or through a resync (e.g. after
 * the phone was locked).
 */
export function useClosures(onClosed: (key: ClosureKey) => void): ClosureState {
  const [closures, setClosures] = useState<ClosureState>(NO_CLOSURES);
  const known = useRef<ClosureState>(NO_CLOSURES);
  const onClosedRef = useLatest(onClosed);

  const apply = useCallback((next: ClosureState) => {
    const prev = known.current;
    known.current = next;
    setClosures(next);
    for (const k of CLOSURE_KEYS) {
      if (next[k] && !prev[k]) onClosedRef.current(k);
    }
  }, [onClosedRef]);

  const load = useCallback(async () => {
    try {
      const rows = unwrap(
        await getSupabaseBrowserClient().from("closures").select("key, is_closed"),
      );
      const next = { ...NO_CLOSURES };
      for (const r of rows) if (isClosureKey(r.key)) next[r.key] = r.is_closed;
      apply(next);
    } catch (e) {
      console.error("[closures]", e);
    }
  }, [apply]);

  useTableChanges("closures", {
    onResync: load,
    onChange: (p) => {
      if (p.eventType === "DELETE") return void load();
      if (isClosureKey(p.new.key)) apply({ ...known.current, [p.new.key]: p.new.is_closed });
    },
  });

  return closures;
}
