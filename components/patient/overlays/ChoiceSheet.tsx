"use client";

import { Icon } from "@/components/Icon";
import { fill, type Dictionary } from "@/lib/navconnect/i18n";
import type { ClosureKey } from "@/lib/navconnect/types";
import { cx } from "../cx";
import { Sheet } from "./Sheet";

type Props = {
  t: Dictionary;
  closure: ClosureKey;
  /** Whether a demo detour exists for this closure and destination. */
  hasDetour: boolean;
  /** Extra metres the detour adds. */
  extra: number;
  onDetour: () => void;
  onVolunteer: () => void;
  onClose: () => void;
};

/** Shown when part of the visitor's route closes mid-navigation: detour or volunteer. */
export function ChoiceSheet({ t, closure, hasDetour, extra, onDetour, onVolunteer, onClose }: Props) {
  return (
    <Sheet onClose={onClose} labelledBy="choice-h">
      <h3 id="choice-h">{t.choiceTitle}</h3>
      <p>{fill(t.choiceSub, { what: t.closedWhat[closure] })}</p>
      <div className={cx("reasons")}>
        {hasDetour && (
          <button className={cx("opt")} onClick={onDetour} autoFocus>
            <span className={cx("oi")}>
              <Icon name="right" size={22} />
            </span>
            <span>
              <strong>{t.optDetour}</strong>
              <small>{fill(t.optDetourSub, { m: extra })}</small>
            </span>
          </button>
        )}
        <button className={cx("opt")} onClick={onVolunteer} autoFocus={!hasDetour}>
          <span className={cx("oi", "warn")}>
            <Icon name="help" size={22} />
          </span>
          <span>
            <strong>{t.optVol}</strong>
            <small>{t.optVolSub}</small>
          </span>
        </button>
      </div>
      <p className={cx("fine")}>{hasDetour ? t.detourNote : t.noDetour}</p>
    </Sheet>
  );
}
