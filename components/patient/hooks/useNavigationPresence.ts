"use client";

import { useEffect } from "react";
import { trackNavigation } from "@/lib/supabase/presence";
import type { DestId, LangCode } from "@/lib/navconnect/types";
import { useClientId } from "./useBrowserValues";

/** While this phone is navigating, it counts as an active navigation on the dashboard. */
export function useNavigationPresence(dest: DestId | null, lang: LangCode, navigating: boolean): void {
  const clientId = useClientId();
  const active = navigating && dest !== null;

  useEffect(() => {
    if (!clientId || !active || !dest) return;
    trackNavigation(clientId, { dest, lang, since: new Date().toISOString() });
    return () => trackNavigation(clientId, null);
  }, [clientId, active, dest, lang]);
}
