"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { MarkIcon } from "@/components/Icon";
import { unlockStaffDashboard } from "./auth-actions";
import styles from "./staff-login.module.css";

export function StaffLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await unlockStaffDashboard(password);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.mark} aria-hidden="true">
          <MarkIcon size={24} stroke={2.4} />
        </div>
        <h1>Staff dashboard</h1>
        <p className={styles.sub}>Enter the staff password to continue.</p>

        <label htmlFor="staff-password">Password</label>
        <input
          id="staff-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "staff-password-error" : undefined}
        />
        {error && (
          <p id="staff-password-error" className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={!password || pending}>
          {pending ? "Unlocking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
