"use client";

import { Icon } from "@/components/Icon";
import type { Dictionary } from "@/lib/navconnect/i18n";
import { cx } from "../cx";
import { Sheet } from "./Sheet";

type Props = {
  t: Dictionary;
  onCamera: () => void;
  onLibrary: () => void;
  onClose: () => void;
};

/** Asks how to provide the appointment letter: take a photo or pick an existing image. */
export function ScanSourceSheet({ t, onCamera, onLibrary, onClose }: Props) {
  return (
    <Sheet onClose={onClose} labelledBy="scan-source-h">
      <h3 id="scan-source-h">{t.scanSourceTitle}</h3>
      <div className={cx("reasons")}>
        <button className={cx("opt")} onClick={onCamera} autoFocus>
          <span className={cx("oi")}>
            <Icon name="camera" size={22} />
          </span>
          <span>
            <strong>{t.scanTake}</strong>
            <small>{t.scanTakeSub}</small>
          </span>
        </button>
        <button className={cx("opt")} onClick={onLibrary}>
          <span className={cx("oi")}>
            <Icon name="image" size={22} />
          </span>
          <span>
            <strong>{t.scanChoose}</strong>
            <small>{t.scanChooseSub}</small>
          </span>
        </button>
      </div>
      <p className={cx("fine")}>{t.scanDemoNote}</p>
    </Sheet>
  );
}
