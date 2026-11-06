"use client";

// This phone's current help request. Sends through a Server Action and listens for
// staff assigning a volunteer, filtered to this device's client id.

import { useCallback, useRef, useState } from "react";
import { sendHelpRequest, type SendHelpRequestInput } from "@/app/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTableChanges } from "@/lib/supabase/use-table-changes";
import type { Row } from "@/lib/supabase/utils";
import type { ClosureKey } from "@/lib/navconnect/types";
import { useClientId } from "./useBrowserValues";
import { useLatest } from "./useLatest";

export type HelpRequestState = {
  /** Null until the server confirms the insert. */
  id: string | null;
  status: "open" | "assigned" | "done";
  volunteer: string | null;
  /** Set for escort requests sent from a closure. */
  escort: ClosureKey | null;
  error: string | null;
};

type SendInput = Omit<SendHelpRequestInput, "clientId">;

export function useHelpRequest(onAssigned: (volunteer: string) => void) {
  const clientId = useClientId();
  const [req, setReq] = useState<HelpRequestState | null>(null);
  const reqRef = useRef<HelpRequestState | null>(null);
  const onAssignedRef = useLatest(onAssigned);

  const commit = useCallback((next: HelpRequestState | null) => {
    reqRef.current = next;
    setReq(next);
  }, []);

  /** Apply a row from the database; announces the volunteer the first time. */
  const applyRow = useCallback(
    (row: Pick<Row<"help_requests">, "id" | "status" | "volunteer">) => {
      const cur = reqRef.current;
      if (!cur || cur.id !== row.id) return;
      if (row.status === "assigned" && cur.status === "open" && row.volunteer) {
        commit({ ...cur, status: "assigned", volunteer: row.volunteer });
        onAssignedRef.current(row.volunteer);
      }
    },
    [commit, onAssignedRef],
  );

  // Catch up after a reconnect or unlock: the volunteer may have been assigned meanwhile,
  // or the demo may have been reset (the request is gone).
  const resync = useCallback(async () => {
    const id = reqRef.current?.id;
    if (!id || reqRef.current?.status !== "open") return;
    const { data, error } = await getSupabaseBrowserClient()
      .from("help_requests")
      .select("id, status, volunteer")
      .eq("id", id)
      .maybeSingle();
    if (error) return;
    if (!data) {
      if (reqRef.current?.id === id) commit(null);
      return;
    }
    applyRow(data);
  }, [applyRow, commit]);

  const send = useCallback(
    async (input: SendInput) => {
      if (!clientId) return;
      const pending: HelpRequestState = {
        id: null,
        status: "open",
        volunteer: null,
        escort: input.escortFor ?? null,
        error: null,
      };
      commit(pending);
      const result = await sendHelpRequest({ ...input, clientId });
      // Ignore the result if a newer request replaced this one meanwhile.
      if (reqRef.current !== pending) return;
      if (!result.ok) {
        commit({ ...pending, error: result.error });
        return;
      }
      commit({ ...pending, id: result.data.id });
      // In case staff assigned someone before the id arrived.
      void resync();
    },
    [clientId, commit, resync],
  );

  /** Mark an assigned request as handled on this phone (the visitor closed the sheet). */
  const dismiss = useCallback(() => {
    const cur = reqRef.current;
    if (cur?.status === "assigned") commit({ ...cur, status: "done" });
    else if (cur?.error) commit(null);
  }, [commit]);

  useTableChanges("help_requests", {
    enabled: clientId !== null,
    filter: `client_id=eq.${clientId}`,
    onResync: resync,
    onChange: (p) => {
      // DELETE events carry only the primary key under RLS, so resync instead.
      if (p.eventType === "DELETE") return void resync();
      applyRow(p.new);
    },
  });

  return { req, send, dismiss };
}
