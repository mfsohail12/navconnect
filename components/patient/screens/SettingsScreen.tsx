import { Icon } from "@/components/Icon";
import { I, LANGS, type Dictionary } from "@/lib/navconnect/i18n";
import { cx } from "../cx";
import { TEXT_SCALES, type Prefs } from "../hooks/usePrefs";

type Props = {
  t: Dictionary;
  prefs: Prefs;
  onChange: (patch: Partial<Prefs>) => void;
  onBack: () => void;
};

const SIZE_PREVIEW = ["0.9em", "1.1em", "1.35em"];

function Switch({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cx("sw")}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
    />
  );
}

export function SettingsScreen({ t, prefs, onChange, onBack }: Props) {
  return (
    <section className={cx("screen")} aria-labelledby="settings-h">
      <header className={cx("app-h")}>
        <button className={cx("icon-btn")} onClick={onBack} aria-label="back">
          <Icon name={t.rtl ? "fwd" : "back"} />
        </button>
        <h2 id="settings-h">{t.settings}</h2>
      </header>
      <div className={cx("screen-body")}>
        <div className={cx("set-group")}>
          <span className={cx("set-label")}>{t.lang}</span>
          <div className={cx("seg")}>
            {LANGS.map((l) => (
              <button
                key={l}
                lang={l}
                aria-pressed={prefs.lang === l}
                onClick={() => onChange({ lang: l })}
              >
                {I[l].name}
              </button>
            ))}
          </div>
        </div>
        <div className={cx("set-group")}>
          <span className={cx("set-label")}>{t.textSize}</span>
          <div className={cx("seg")}>
            {TEXT_SCALES.map((s, i) => (
              <button
                key={s}
                style={{ fontSize: SIZE_PREVIEW[i] }}
                aria-pressed={prefs.scale === s}
                aria-label={`${t.textSize} ${i + 1}`}
                onClick={() => onChange({ scale: s })}
              >
                A
              </button>
            ))}
          </div>
        </div>
        <div className={cx("row-toggle")}>
          <div>
            <strong>{t.contrast}</strong>
          </div>
          <Switch checked={prefs.hc} label={t.contrast} onClick={() => onChange({ hc: !prefs.hc })} />
        </div>
        <div className={cx("row-toggle")}>
          <div>
            <strong>{t.audio}</strong>
          </div>
          <Switch checked={prefs.audio} label={t.audio} onClick={() => onChange({ audio: !prefs.audio })} />
        </div>
        <div className={cx("row-toggle")}>
          <div>
            <strong>{t.haptic}</strong>
          </div>
          <Switch checked={prefs.haptic} label={t.haptic} onClick={() => onChange({ haptic: !prefs.haptic })} />
        </div>
        <p className={cx("legend")}>{t.legend}</p>
        <div className={cx("set-group")}>
          <span className={cx("set-label")}>{t.pace}</span>
          <div className={cx("seg")}>
            <button aria-pressed={prefs.pace === "n"} onClick={() => onChange({ pace: "n" })}>
              {t.paceN}
            </button>
            <button aria-pressed={prefs.pace === "s"} onClick={() => onChange({ pace: "s" })}>
              {t.paceS}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
