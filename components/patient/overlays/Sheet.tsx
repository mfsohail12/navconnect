"use client";

import { useEffect, type ReactNode } from "react";
import { useLatest } from "../hooks/useLatest";
import { cx } from "../cx";

type Props = {
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
};

/** Bottom sheet over the phone. Closes on Escape or a tap on the backdrop. */
export function Sheet({ onClose, labelledBy, children }: Props) {
  const onCloseRef = useLatest(onClose);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCloseRef]);

  return (
    <div
      className={cx("sheet-wrap")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={cx("sheet")} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  );
}
