"use client";

// Subscribe a Client Component to realtime changes on one table.
//
// `onResync` should refetch the full data you show. It runs:
//   - once the subscription is live (covers the initial load and missed events),
//   - after the realtime connection reconnects,
//   - when the tab becomes visible again or the device comes back online.
// Phones drop the websocket when locked or backgrounded, so this keeps a phone
// that sat locked during the pitch from missing a closure or a volunteer update.

import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";
import type { Row, TableName } from "./utils";

type Options<T extends TableName> = {
  /** Postgres changes filter, e.g. `client_id=eq.${clientId}`. */
  filter?: string;
  /** Set to false to pause the subscription. Defaults to true. */
  enabled?: boolean;
  /** Called for every INSERT, UPDATE and DELETE. Check `payload.eventType`. */
  onChange?: (payload: RealtimePostgresChangesPayload<Row<T>>) => void;
  /** Refetch everything from the database. */
  onResync?: () => void;
};

let channelCounter = 0;

export function useTableChanges<T extends TableName>(
  table: T,
  { filter, enabled = true, onChange, onResync }: Options<T> = {},
): void {
  // Keep the latest callbacks without resubscribing on every render.
  const onChangeRef = useRef(onChange);
  const onResyncRef = useRef(onResync);
  useEffect(() => {
    onChangeRef.current = onChange;
    onResyncRef.current = onResync;
  });

  useEffect(() => {
    if (!enabled) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`table:${table}:${filter ?? "all"}:${++channelCounter}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => {
          onChangeRef.current?.(
            payload as RealtimePostgresChangesPayload<Row<T>>,
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") onResyncRef.current?.();
      });

    const resync = () => {
      if (document.visibilityState === "visible") onResyncRef.current?.();
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("online", resync);

    return () => {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("online", resync);
      void supabase.removeChannel(channel);
    };
  }, [table, filter, enabled]);
}
