import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { DEST } from "@/lib/navconnect/destinations";
import { fill, floorLabel, instr, type Dictionary } from "@/lib/navconnect/i18n";
import { SICON, walkSpeed } from "@/lib/navconnect/routes";
import type { DestId, LangCode, Pace } from "@/lib/navconnect/types";
import { cx } from "../cx";
import type { NavState, Ride } from "../hooks/useNavigation";

type Props = {
  t: Dictionary;
  lang: LangCode;
  dest: DestId;
  nav: NavState;
  ride: Ride | null;
  pan: "left" | "right" | null;
  pace: Pace;
  audio: boolean;
  haptic: boolean;
  speaking: boolean;
  banner: string | null;
  onToggleAudio: () => void;
  onToggleHaptic: () => void;
  onWalk: () => void;
  onSkip: () => void;
  onHelp: () => void;
  onEnd: () => void;
};

/** The simulated camera view: a corridor drawn with CSS, with chevrons on the floor. */
function ArScene({ pan }: { pan: "left" | "right" | null }) {
  return (
    <div className={cx("scene", pan && `pan-${pan}`)}>
      {["ceil", "wl", "wr", "back", "floor"].map((p) => (
        <div key={p} className={cx("poly", p)} />
      ))}
      {["d1", "d2", "d3", "d4"].map((d) => (
        <div key={d} className={cx("poly", "door", d)} />
      ))}
      <div className={cx("poly", "sign")} />
      {["lt1", "lt2", "lt3"].map((l) => (
        <div key={l} className={cx("poly", "lt", l)} />
      ))}
      <div className={cx("poly", "fline")} />
      <div className={cx("plane")}>
        <i className={cx("chev")} />
        <i className={cx("chev")} />
        <i className={cx("chev")} />
        <i className={cx("chev")} />
      </div>
    </div>
  );
}

export function NavScreen(props: Props) {
  const { t, lang, dest, nav, ride, pan, pace, banner } = props;
  const r = nav.route;
  const s = r.steps[nav.i];
  const next = r.steps[nav.i + 1];

  const total = r.steps.reduce((a, x) => a + x.m, 0);
  const done = r.steps.slice(0, nav.i).reduce((a, x) => a + x.m, 0) + (s.m - nav.left);
  const remaining = Math.max(0, Math.round(total - done));
  const vertical =
    nav.floor === "main" && r.steps.slice(nav.i).some((x) => x.a === "elev" || x.a === "down")
      ? 50
      : 0;
  const minutes = Math.max(1, Math.round((remaining / walkSpeed(pace) + vertical) / 60));

  const showTurn = (s.a === "left" || s.a === "right") && nav.left < 14;
  const showElev = (s.a === "elev" || s.a === "down") && nav.left < 16;
  const showPin = s.a === "arrive" && nav.left < 28;
  const walking = nav.walking && !nav.riding;

  return (
    <section
      className={cx("screen", "nav")}
      style={{ "--lc": `var(--l-${DEST[dest].line})` } as CSSProperties}
      aria-label={t.dest[dest]}
    >
      <div className={cx("ar", walking && "walking")} dir="ltr">
        <ArScene pan={pan} />
        <div className={cx("anchor")} hidden={!showTurn}>
          <div className={cx("an-arrow")}>
            <Icon name={s.a === "left" ? "left" : "right"} size={54} stroke={2.6} />
          </div>
        </div>
        <div className={cx("anchor")} hidden={!showElev}>
          <div className={cx("an-arrow")}>
            <Icon name={s.a === "down" ? "down" : "elev"} size={50} stroke={2.4} />
          </div>
          <div className={cx("an-label")}>{showElev ? instr(s, dest, lang) : ""}</div>
        </div>
        <div className={cx("anchor")} hidden={!showPin}>
          <div className={cx("an-arrow")}>
            <Icon name="pin" size={44} stroke={2.4} />
          </div>
          <div className={cx("an-label")}>{t.dest[dest]}</div>
        </div>
        <span className={cx("cam-badge")}>{t.cam}</span>
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
            <div className={cx("nv-dist")}>~{Math.max(0, Math.ceil(nav.left))} m</div>
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
          <span className={cx("floor-chip")}>{floorLabel(nav.floor, lang)}</span>
        </div>
      </div>

      <div className={cx("nav-bottom")}>
        <div className={cx("prog")}>
          <i style={{ width: `${((done / total) * 100).toFixed(1)}%` }} />
        </div>
        <div className={cx("nb-row")}>
          <span>
            <b>~{remaining} m</b> <span>{t.remaining}</span>
          </span>
          <span>
            <b>{minutes}</b> <span>{t.min}</span>
          </span>
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
          <button className={cx("ctrl", "primary")} onClick={props.onWalk}>
            <Icon name={nav.walking ? "pause" : "play"} />
            <span>{nav.walking ? t.pause : t.walk}</span>
          </button>
          <button className={cx("ctrl")} onClick={props.onSkip}>
            <Icon name="skip" />
            <span>{t.next}</span>
          </button>
          <button className={cx("ctrl", "help")} onClick={props.onHelp}>
            <Icon name="help" />
            <span>{t.helpBtn}</span>
          </button>
        </div>
        <button className={cx("btn", "btn-ghost")} style={{ minHeight: 44 }} onClick={props.onEnd}>
          <span>{t.end}</span>
        </button>
      </div>

      {ride && (
        <div className={cx("riding")} role="status">
          <div className={cx("rc")}>
            <Icon name="elev" size={52} />
            <div className={cx("fl")}>{ride.fl}</div>
            <p>
              {ride.kind === "elev" && ride.el
                ? fill(t.riding, { el: t.el[ride.el] })
                : t.goingDown}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
