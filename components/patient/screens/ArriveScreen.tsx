import { Icon } from "@/components/Icon";
import { DEST } from "@/lib/navconnect/destinations";
import type { Dictionary } from "@/lib/navconnect/i18n";
import type { DestId } from "@/lib/navconnect/types";
import { cx } from "../cx";

type Props = {
  t: Dictionary;
  dest: DestId;
  seconds: number;
  onNew: () => void;
};

export function ArriveScreen({ t, dest, seconds, onNew }: Props) {
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <section className={cx("screen")} aria-labelledby="arrive-h">
      <div className={cx("screen-body", "arrive-body")}>
        <div className={cx("done-ring")}>
          <Icon name="check" size={64} stroke={2.6} />
        </div>
        <h2 id="arrive-h">{t.arrived}</h2>
        <p className={cx("dn")}>{t.dest[dest]}</p>
        <p>{t.arrivedSub}</p>
        <div className={cx("recept")}>
          <div>
            <span>{t.roomL}</span>
            <b>{DEST[dest].loc}</b>
          </div>
          <div>
            <span>{t.total}</span>
            <b>{time}</b>
          </div>
        </div>
      </div>
      <footer className={cx("app-f")}>
        <button className={cx("btn", "btn-primary")} onClick={onNew}>
          <Icon name="search" />
          <span>{t.home}</span>
        </button>
      </footer>
    </section>
  );
}
