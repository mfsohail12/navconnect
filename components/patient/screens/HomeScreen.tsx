import type { CSSProperties } from "react";
import { Icon, MarkIcon } from "@/components/Icon";
import { DEST, searchDestinations } from "@/lib/navconnect/destinations";
import type { Dictionary } from "@/lib/navconnect/i18n";
import type { DestId, LangCode } from "@/lib/navconnect/types";
import { cx } from "../cx";

type Props = {
  t: Dictionary;
  lang: LangCode;
  query: string;
  onQuery: (q: string) => void;
  onPick: (id: DestId) => void;
  onScan: () => void;
  onSettings: () => void;
  onLanguage: () => void;
  onHelp: () => void;
};

export function HomeScreen({ t, lang, query, onQuery, onPick, onScan, onSettings, onLanguage, onHelp }: Props) {
  const list = searchDestinations(query, lang);
  return (
    <section className={cx("screen")} aria-label="NavConnect">
      <header className={cx("app-h")}>
        <div className={cx("logo-sm")}>
          <span className={cx("mark")}>
            <MarkIcon />
          </span>
          NavConnect
        </div>
        <div className={cx("h-actions")}>
          <button className={cx("pill-btn")} onClick={onLanguage} aria-label="Change language">
            <Icon name="globe" size={18} />
            <span>{t.code}</span>
          </button>
          <button className={cx("icon-btn")} onClick={onSettings} aria-label={t.settings}>
            <Icon name="settings" />
          </button>
        </div>
      </header>
      <div className={cx("screen-body")}>
        <p className={cx("here")}>
          <Icon name="pin" size={16} />
          <span>{t.here}</span>
        </p>
        <h2 className={cx("greet")}>{t.greet}</h2>
        <label className={cx("search")}>
          <Icon name="search" />
          <input
            type="search"
            autoComplete="off"
            placeholder={t.search}
            aria-label={t.search}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        <button className={cx("scan-card")} onClick={onScan}>
          <span className={cx("ci")}>
            <Icon name="camera" />
          </span>
          <span>
            <strong>{t.scan}</strong>
            <small>{t.scanSub}</small>
          </span>
        </button>
        <h3 className={cx("sec")}>{t.popular}</h3>
        <div className={cx("dest-grid")}>
          {list.length === 0 ? (
            <p className={cx("empty")}>{t.none}</p>
          ) : (
            list.map((id) => (
              <button
                key={id}
                className={cx("dest")}
                style={{ "--lc": `var(--l-${DEST[id].line})` } as CSSProperties}
                onClick={() => onPick(id)}
              >
                <span className={cx("d-ic")}>
                  <Icon name={DEST[id].icon} size={24} />
                </span>
                <span className={cx("d-name")}>{t.dest[id]}</span>
                <span className={cx("d-sub")}>{t.subs[id]}</span>
              </button>
            ))
          )}
        </div>
      </div>
      <footer className={cx("app-f")}>
        <button className={cx("btn", "btn-help")} onClick={onHelp}>
          <Icon name="help" />
          <span>{t.needHelpBtn}</span>
        </button>
      </footer>
    </section>
  );
}
