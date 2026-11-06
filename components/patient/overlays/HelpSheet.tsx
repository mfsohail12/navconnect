"use client";

import { Icon } from "@/components/Icon";
import { fill, type Dictionary } from "@/lib/navconnect/i18n";
import { cx } from "../cx";
import type { HelpRequestState } from "../hooks/useHelpRequest";
import { Sheet } from "./Sheet";

type Props = {
  t: Dictionary;
  /** The current request, if one is in progress. */
  req: HelpRequestState | null;
  reason: number;
  onReason: (i: number) => void;
  onSend: () => void;
  onClose: () => void;
};

/** "Get help from a volunteer": choose a reason, then wait for a volunteer. */
export function HelpSheet({ t, req, reason, onReason, onSend, onClose }: Props) {
  if (req && req.status !== "done") {
    return (
      <Sheet onClose={onClose} labelledBy="help-h">
        {req.error ? (
          <div className={cx("wait")}>
            <h3 id="help-h">{t.helpTitle}</h3>
            {/* Not in the prototype; English only. */}
            <p role="alert">Couldn’t send the request. Check the connection and try again.</p>
          </div>
        ) : req.status === "open" ? (
          <div className={cx("wait")}>
            <div className={cx("spinner")} />
            <h3 id="help-h">{req.escort ? t.escortTitle : t.sent}</h3>
            <p>{req.escort ? t.escortSub : t.sentSub}</p>
          </div>
        ) : (
          <div className={cx("wait")}>
            <div className={cx("vol-ok")}>
              <Icon name="check" size={34} stroke={2.6} />
            </div>
            <h3 id="help-h">{fill(t.assigned, { name: req.volunteer })}</h3>
            <p>{t.assignedSub}</p>
          </div>
        )}
        <button
          className={cx("btn", req.status === "assigned" ? "btn-primary" : "btn-ghost")}
          onClick={onClose}
          autoFocus
        >
          {t.close}
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} labelledBy="help-h">
      <h3 id="help-h">{t.helpTitle}</h3>
      <p>{t.helpSub}</p>
      <div className={cx("reasons")}>
        {t.reasons.map((r, i) => (
          <button
            key={i}
            className={cx("reason")}
            aria-pressed={i === reason}
            onClick={() => onReason(i)}
            autoFocus={i === 0}
          >
            {r}
          </button>
        ))}
      </div>
      <p style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Icon name="pin" size={16} />
        {t.shareLoc}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button className={cx("btn", "btn-ghost")} onClick={onClose}>
          {t.cancel}
        </button>
        <button className={cx("btn", "btn-primary")} onClick={onSend}>
          {t.send}
        </button>
      </div>
    </Sheet>
  );
}
