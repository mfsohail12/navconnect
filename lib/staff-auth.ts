// Staff dashboard gate. One shared password in STAFF_DASHBOARD_PASSWORD, no user accounts.
// Unlocking sets an httpOnly cookie holding an HMAC derived from the password, so the
// password never reaches the browser and changing it signs everyone out.
// Server-only: the `server-only` import fails the build if a Client Component imports this.

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const STAFF_COOKIE = "nc_staff";

function configuredPassword(): string | null {
  return process.env.STAFF_DASHBOARD_PASSWORD || null;
}

/** True when the env var is set. Without it the dashboard stays locked for everyone. */
export function isStaffAuthConfigured(): boolean {
  return configuredPassword() !== null;
}

function hmac(key: string, message: string): Buffer {
  return createHmac("sha256", key).update(message).digest();
}

/** Constant-time check of a submitted password. */
export function passwordMatches(input: string): boolean {
  const password = configuredPassword();
  if (!password) return false;
  // Hashing both sides gives equal-length buffers, which timingSafeEqual requires.
  return timingSafeEqual(hmac("staff-password-check", input), hmac("staff-password-check", password));
}

/** The cookie value that proves the password was entered. */
export function sessionToken(): string | null {
  const password = configuredPassword();
  return password ? hmac(password, "staff-dashboard-session").toString("hex") : null;
}

/** True when the request carries a valid unlock cookie. */
export async function isStaffAuthenticated(): Promise<boolean> {
  // Read the cookie first, even when no password is configured. This marks the caller as
  // request-time, so a build without the env var can't prerender a baked-in "locked" page.
  const actual = (await cookies()).get(STAFF_COOKIE)?.value;
  const expected = sessionToken();
  if (!expected) return false;
  if (!actual || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
