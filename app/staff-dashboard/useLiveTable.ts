"use client";

// Keep a table's rows in sync with the database via useTableChanges.
// INSERT/UPDATE events are applied directly. DELETEs (which carry only the primary key
// under RLS) and bursts like reset_demo() trigger a debounced full reload instead.

import { useCallback, useEffect, useRef, useState } from "react";
import { useTableChanges } from "@/lib/supabase/use-table-changes";
import type { Row, TableName } from "@/lib/supabase/utils";

type Options<T extends TableName> = {
  /** Fetch the full set of rows to show. */
  load: () => Promise<Row<T>[]>;
  /** Stable key for a row. */
  key: (row: Row<T>) => string;
  /** Order for the list (applied after live inserts and updates). */
  sort?: (a: Row<T>, b: Row<T>) => number;
  /** Called for each live INSERT (not for reloads). */
  onInsert?: (row: Row<T>) => void;
  onError?: (message: string) => void;
};

export function useLiveTable<T extends TableName>(table: T, opts: Options<T>): Row<T>[] | null {
  const [rows, setRows] = useState<Row<T>[] | null>(null);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  const reload = useCallback(async () => {
    try {
      setRows(await optsRef.current.load());
    } catch (e) {
      optsRef.current.onError?.(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const reloadSoon = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void reload(), 250);
  }, [reload]);

  useTableChanges(table, {
    onResync: reload,
    onChange: (p) => {
      if (p.eventType === "DELETE") return reloadSoon();
      const { key, sort, onInsert } = optsRef.current;
      const row = p.new as Row<T>;
      setRows((list) => {
        if (!list) return list; // initial load hasn't arrived yet; it will include this row
        const k = key(row);
        const i = list.findIndex((r) => key(r) === k);
        const next = i === -1 ? [...list, row] : list.map((r, j) => (j === i ? row : r));
        return sort ? next.sort(sort) : next;
      });
      if (p.eventType === "INSERT") onInsert?.(row);
    },
  });

  return rows;
}
