"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { STAFF_COOKIE, isStaffAuthConfigured, passwordMatches, sessionToken } from "@/lib/staff-auth";

export type UnlockResult = { ok: true } | { ok: false; error: string };

export async function unlockStaffDashboard(password: string): Promise<UnlockResult> {
  if (!isStaffAuthConfigured()) {
    return { ok: false, error: "STAFF_DASHBOARD_PASSWORD is not set on the server." };
  }
  if (typeof password !== "string" || !passwordMatches(password)) {
    return { ok: false, error: "Incorrect password." };
  }
  const token = sessionToken();
  if (!token) return { ok: false, error: "Could not unlock the dashboard." };

  (await cookies()).set(STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Not secure-only: phones testing over http://<lan-ip>:3000 must still get the cookie.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Session cookie: the dashboard re-locks when the browser closes.
  });
  revalidatePath("/staff-dashboard");
  return { ok: true };
}

export async function lockStaffDashboard(): Promise<void> {
  (await cookies()).delete(STAFF_COOKIE);
  revalidatePath("/staff-dashboard");
}
