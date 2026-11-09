import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { DEST } from "@/lib/navconnect/destinations";
import { floorLabel, instr, type Dictionary } from "@/lib/navconnect/i18n";
import { SICON, floorAt, walkSpeed } from "@/lib/navconnect/routes";
import type { DestId, LangCode, Pace } from "@/lib/navconnect/types";
import { cx } from "../cx";
import type { NavState } from "../hooks/useNavigation";
import { StepScene } from "../scenes/StepScene";

type Props = {
  t: Dictionary;
  lang: LangCode;
  dest: DestId;
  nav: NavState;
  pace: Pace;
  audio: boolean;
  haptic: boolean;
  speaking: boolean;
  banner: string | null;
  onToggleAudio: () => void;
  onToggleHaptic: () => void;
  onNext: () => void;
  onBack: () => void;
  onHelp: () => void;
  onEnd: () => void;
};

export function NavScreen(props: Props) {
  const { t, lang, dest, nav, pace, banner } = props;
  const r = nav.route;
  const s = r.steps[nav.i];
  const next = r.steps[nav.i + 1];
  const floor = floorAt(r, nav.i);
  const last = nav.i === r.steps.length - 1;

  // Progress moves a whole step at a time, when the presenter taps Continue or Back.
  const total = r.steps.reduce((a, x) => a + x.m, 0);
  const done = r.steps.slice(0, nav.i).reduce((a, x) => a + x.m, 0);
  const remaining = Math.max(0, Math.round(total - done));
  const vertical =
    floor === "main" && r.steps.slice(nav.i).some((x) => x.a === "elev" || x.a === "down") ? 50 : 0;
  const minutes = Math.max(1, Math.round((remaining / walkSpeed(pace) + vertical) / 60));

  const cta = !nav.started ? t.navStart : last ? t.navFinish : t.navNext;

  return (
    <section
      className={cx("screen", "nav")}
      style={{ "--lc": `var(--l-${DEST[dest].line})` } as CSSProperties}
      aria-label={t.dest[dest]}
    >
      <div className={cx("ar")} dir="ltr">
        <StepScene
          step={s}
          description={instr(s, dest, lang)}
          sceneKey={`${nav.i}-${r.detourFor ?? "base"}`}
        />
      </div>

      {banner && (
        <div className={cx("reroute")} role="status">
          <Icon name="alert" />
          <span>{banner}</span>
        </div>
      )}

      <div className={cx("nav-card")}>
        <div className={cx("nv-main")}>
          <div className={cx("nv-ic")}>
            <Icon name={SICON[s.a]} size={40} stroke={2.4} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className={cx("nv-dist")}>~{s.m} m</div>
            <div className={cx("nv-text")}>{instr(s, dest, lang)}</div>
          </div>
        </div>
        <div className={cx("nv-meta")}>
          {next && (
            <div className={cx("nv-then")}>
              <b>{t.then}</b>
              <span>{instr(next, dest, lang)}</span>
            </div>
          )}
          <span className={cx("floor-chip")}>{floorLabel(floor, lang)}</span>
        </div>
      </div>

      <div className={cx("nav-bottom")}>
        <div
          className={cx("prog")}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={r.steps.length}
          aria-valuenow={nav.i}
        >
          {r.steps.map((_, idx) => (
            <i key={idx} className={cx(idx < nav.i && "done")} />
          ))}
        </div>
        <div className={cx("nb-row")}>
          <span>
            <b>~{remaining} m</b> <span>{t.remaining}</span>
          </span>
          <span>
            <b>{minutes}</b> <span>{t.min}</span>
          </span>
        </div>
        <div className={cx("nav-actions")}>
          <button
            className={cx("ctrl", "nav-back")}
            onClick={props.onBack}
            disabled={!nav.started || nav.i === 0}
          >
            <Icon name="back" />
            <span>{t.navBack}</span>
          </button>
          <button
            className={cx("btn", "nav-cta", !nav.started ? "begin" : last ? "finish" : "cont")}
            onClick={props.onNext}
          >
            <Icon name={!nav.started ? "play" : last ? "check" : "fwd"} />
            <span>{cta}</span>
          </button>
        </div>
        <div className={cx("ctrls")}>
          <button
            className={cx("ctrl", props.speaking && "speaking")}
            aria-pressed={props.audio}
            onClick={props.onToggleAudio}
          >
            <Icon name="speaker" />
            <span>{t.audioShort}</span>
          </button>
          <button className={cx("ctrl")} aria-pressed={props.haptic} onClick={props.onToggleHaptic}>
            <Icon name="vibrate" />
            <span>{t.hapShort}</span>
          </button>
          <button className={cx("ctrl", "help")} onClick={props.onHelp}>
            <Icon name="help" />
            <span>{t.helpBtn}</span>
          </button>
          <button className={cx("ctrl", "end")} aria-label={t.end} onClick={props.onEnd}>
            <Icon name="close" />
            <span>{t.endShort}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
