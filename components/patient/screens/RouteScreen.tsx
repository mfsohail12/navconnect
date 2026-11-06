import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { DEST } from "@/lib/navconnect/destinations";
import { floorLabel, instr, type Dictionary } from "@/lib/navconnect/i18n";
import { SICON, closedFor, getRoute, stats } from "@/lib/navconnect/routes";
import { ELEVS } from "@/lib/navconnect/map";
import type { ClosureKey, ClosureState, DestId, LangCode, Pace } from "@/lib/navconnect/types";
import { FloorMap } from "../FloorMap";
import { cx } from "../cx";

type Props = {
  t: Dictionary;
  lang: LangCode;
  dest: DestId;
  closures: ClosureState;
  pace: Pace;
  onBack: () => void;
  onStart: () => void;
  onAskVolunteer: (k: ClosureKey) => void;
};

export function RouteScreen({ t, lang, dest, closures, pace, onBack, onStart, onAskVolunteer }: Props) {
  const r = getRoute(dest, closures);
  const st = stats(r, pace);
  const d = DEST[dest];
  const floorChange = r.steps.some((s) => s.a === "elev" || s.a === "down");
  const closed = closedFor(dest, closures);
  const detour = r.detourFor;

  return (
    <section className={cx("screen")} aria-labelledby="route-h">
      <header className={cx("app-h")}>
        <button className={cx("icon-btn")} onClick={onBack} aria-label="back">
          <Icon name={t.rtl ? "fwd" : "back"} />
        </button>
        <h2 id="route-h">{t.route}</h2>
      </header>
      <div
        className={cx("screen-body")}
        style={{ "--lc": `var(--l-${d.line})` } as CSSProperties}
      >
        <div className={cx("dest-head")}>
          <div className={cx("big-ic")}>
            <Icon name={d.icon} size={28} />
          </div>
          <div>
            <h3>{t.dest[dest]}</h3>
            <p>{t.subs[dest]}</p>
          </div>
        </div>
        <div className={cx("map")}>
          <span className={cx("map-cap")}>{t.schematic}</span>
          <FloorMap route={r} dest={dest} closures={closures} t={t} />
          <div className={cx("elev-leg")}>
            {ELEVS.map((e) => (
              <span key={e.name}>
                <i style={{ background: e.color }} />
                {e.name}
              </span>
            ))}
          </div>
        </div>
        <div className={cx("stats")}>
          <div className={cx("stat")}>
            <b>~{st.d} m</b>
            <span>{t.dist}</span>
          </div>
          <div className={cx("stat")}>
            <b>{st.min}</b>
            <span>{t.min}</span>
          </div>
          <div className={cx("stat")}>
            <b>{r.steps.length}</b>
            <span>{t.steps}</span>
          </div>
        </div>
        {(floorChange || closed) && (
          <div className={cx("chips")}>
            {floorChange && (
              <span className={cx("chip")}>
                <Icon name="elev" size={14} />
                {t.floorChange}
              </span>
            )}
            {closed && (
              <span className={cx("chip", "warn")}>
                <Icon name="alert" size={14} />
                {detour ? t.detourChip : t.closedChip}
              </span>
            )}
          </div>
        )}
        {closed && (
          <>
            <p className={cx("fine")}>{detour ? t.detourNote : t.noDetour}</p>
            <button className={cx("btn", "btn-ghost")} onClick={() => onAskVolunteer(closed)}>
              <Icon name="help" />
              {t.askVol}
            </button>
          </>
        )}
        <ol className={cx("steps")}>
          {r.steps.map((s, i) => {
            const fl = s.fl ?? "main";
            // Show a floor header when the floor changes from the previous step.
            const header = fl !== (i === 0 ? "main" : (r.steps[i - 1].fl ?? "main"));
            return (
              <li key={i}>
                <span className={cx("s-ic")}>
                  <Icon name={SICON[s.a]} size={20} />
                </span>
                <span className={cx("s-t")}>
                  {header && <span className={cx("s-floor")}>{floorLabel(fl, lang)}</span>}
                  {instr(s, dest, lang)}
                </span>
                <span className={cx("s-m")}>~{s.m} m</span>
              </li>
            );
          })}
        </ol>
      </div>
      <footer className={cx("app-f")}>
        <button className={cx("btn", "btn-primary")} onClick={onStart}>
          <Icon name="up" />
          <span>{t.start}</span>
        </button>
      </footer>
    </section>
  );
}

