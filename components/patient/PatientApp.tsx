"use client";

// The patient phone app. Screens: home → route → nav (AR) → arrive, plus settings.
// Overlays: help sheet, closure choice sheet, letter scan.
// Shared state (closures, help requests) comes from Supabase; everything else is local.

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { logDetourChoice, recordArrival } from "@/app/actions";
import { I, LANGS, LM_EN_PLAIN, fill, instr } from "@/lib/navconnect/i18n";
import { CLOSURE_AFFECTS, detourRoute, getRoute, stats } from "@/lib/navconnect/routes";
import type { ClosureKey, DestId, Route } from "@/lib/navconnect/types";
import { HELP_REASONS } from "@/lib/navconnect/staff";
import { cx } from "./cx";
import { useClock } from "./hooks/useBrowserValues";
import { useClosures } from "./hooks/useClosures";
import { useFeedback } from "./hooks/useFeedback";
import { useHelpRequest } from "./hooks/useHelpRequest";
import { useNavigation } from "./hooks/useNavigation";
import { useNavigationPresence } from "./hooks/useNavigationPresence";
import { usePhoneFit } from "./hooks/usePhoneFit";
import { setPrefs, usePrefs, type Prefs } from "./hooks/usePrefs";
import { ChoiceSheet } from "./overlays/ChoiceSheet";
import { HelpSheet } from "./overlays/HelpSheet";
import { ScanOverlay } from "./overlays/ScanOverlay";
import { ScanSourceSheet } from "./overlays/ScanSourceSheet";
import { ArriveScreen } from "./screens/ArriveScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { NavScreen } from "./screens/NavScreen";
import { RouteScreen } from "./screens/RouteScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

type Screen = "home" | "route" | "nav" | "arrive" | "settings";

type SheetState =
  | { kind: "help" }
  | { kind: "scanSource" }
  | { kind: "choice"; closure: ClosureKey; alt: Route | null; extra: number }
  | null;

export function PatientApp() {
  const prefs = usePrefs();
  const t = I[prefs.lang];
  const clock = useClock();
  const phoneRef = useRef<HTMLDivElement>(null);
  const fb = useFeedback(prefs);
  usePhoneFit(phoneRef);

  const [screen, setScreen] = useState<Screen>("home");
  const [history, setHistory] = useState<Screen[]>([]);
  const [dest, setDest] = useState<DestId | null>(null);
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [helpReason, setHelpReason] = useState(0);
  const [scan, setScan] = useState<"reading" | "found" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [arrival, setArrival] = useState<{ dest: DestId; seconds: number } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scanTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timers = scanTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // ---- screens -------------------------------------------------------------

  function go(name: Screen, push = true) {
    if (push && screen !== name) setHistory((h) => [...h, screen]);
    setScreen(name);
  }

  function back() {
    setScreen(history[history.length - 1] ?? "home");
    setHistory(history.slice(0, -1));
  }

  function showBanner(text: string) {
    setBanner(text);
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 5000);
  }

  // ---- navigation ----------------------------------------------------------

  const navigation = useNavigation({
    dest,
    lang: prefs.lang,
    pace: prefs.pace,
    speak: fb.speak,
    haptic: fb.haptic,
    onFinish: (d, seconds) => {
      fb.speak(fill(t.arrivedSay, { dest: t.dest[d] }));
      setArrival({ dest: d, seconds });
      setHistory([]);
      setScreen("arrive");
      void recordArrival(d, seconds, prefs.lang);
    },
  });

  useNavigationPresence(dest, prefs.lang, navigation.nav !== null);

  function startNav() {
    if (!dest) return;
    navigation.start(getRoute(dest, closures));
    go("nav");
  }

  function endNav() {
    navigation.end();
    fb.stop();
    setSheet((s) => (s?.kind === "choice" ? null : s));
    setHistory([]);
    setScreen("home");
  }

  // ---- closures ------------------------------------------------------------

  /** A closure just became active. Offer a choice if it's on this phone's route. */
  function onClosed(k: ClosureKey) {
    const n = navigation.current();
    if (!n || !dest || !CLOSURE_AFFECTS[k].includes(dest) || n.route.detourFor === k) return;
    fb.haptic("reroute");
    showBanner(t.closedBanner);
    fb.speak(`${t.choiceTitle}. ${fill(t.choiceSub, { what: t.closedWhat[k] })}`);
    const alt = detourRoute(dest, k);
    const extra = alt ? Math.max(5, stats(alt, prefs.pace).d - stats(n.route, prefs.pace).d) : 0;
    setSheet({ kind: "choice", closure: k, alt, extra });
  }

  const closures = useClosures(onClosed);

  function takeDetour(k: ClosureKey, alt: Route) {
    if (!dest) return;
    setSheet(null);
    navigation.reroute(alt);
    showBanner(t.newRoute);
    fb.haptic("reroute");
    fb.speak(
      `${t.newRoute} ${fill(t.inM, { m: Math.ceil(alt.steps[0].m) })}${instr(alt.steps[0], dest, prefs.lang)}`,
    );
    void logDetourChoice(k, dest);
  }

  // ---- help ----------------------------------------------------------------

  const help = useHelpRequest((volunteer) => {
    fb.haptic("arrive");
    setSheet({ kind: "help" });
    fb.speak(fill(t.assigned, { name: volunteer }));
  });

  function sendRequest(o: { reason: number } | { escort: ClosureKey }) {
    const location = LM_EN_PLAIN[navigation.currentLandmark()] ?? LM_EN_PLAIN.start;
    void help.send(
      "escort" in o
        ? { reason: "escort", escortFor: o.escort, lang: prefs.lang, location, destination: dest }
        : {
            reason: HELP_REASONS[o.reason] ?? "other",
            lang: prefs.lang,
            location,
            destination: navigation.current() ? dest : null,
          },
    );
    setSheet({ kind: "help" });
  }

  function closeHelp() {
    help.dismiss();
    setSheet(null);
  }

  // ---- scan ----------------------------------------------------------------

  /** Opens the native camera or photo picker. Must run synchronously inside the tap handler. */
  function pickScanSource(input: HTMLInputElement | null) {
    setSheet(null);
    input?.click();
  }

  /**
   * The photo is deliberately ignored (no upload, no OCR): any picked image
   * plays the simulated reading, then lands on Diagnostic Imaging.
   */
  function onLetterPicked(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.length ?? 0;
    e.target.value = ""; // so choosing the same photo again still fires change
    if (picked > 0) doScan();
  }

  function doScan() {
    if (scan) return;
    setScan("reading");
    // Push into the same array so the unmount cleanup above clears these too.
    scanTimers.current.push(
      setTimeout(() => {
        setScan("found");
        fb.haptic("arrive");
      }, 1700),
      setTimeout(() => {
        setScan(null);
        setDest("img");
        go("route");
      }, 2900),
    );
  }

  // ---- settings ------------------------------------------------------------

  function changePrefs(patch: Partial<Prefs>) {
    setPrefs(patch);
    if (patch.haptic === true) fb.haptic("right", true);
  }

  function toggleAudio() {
    const audio = !prefs.audio;
    setPrefs({ audio });
    if (audio) navigation.announce(true);
    else fb.stop();
  }

  function toggleHaptic() {
    const haptic = !prefs.haptic;
    setPrefs({ haptic });
    if (haptic) fb.haptic("left", true);
  }

  // ---- render --------------------------------------------------------------

  const nav = navigation.nav;

  return (
    <div className={cx("page")}>
      <div
        ref={phoneRef}
        className={cx("phone", prefs.hc && "hc")}
        style={{ "--scale": prefs.scale } as CSSProperties}
        lang={prefs.lang}
        dir={t.rtl ? "rtl" : "ltr"}
      >
        <div className={cx("sb", screen === "nav" && "on-ar")} aria-hidden="true" dir="ltr">
          <span>{clock}</span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            5G <i />
          </span>
        </div>

        <div className={cx("screens")}>
          {screen === "home" && (
            <HomeScreen
              t={t}
              lang={prefs.lang}
              query={query}
              onQuery={setQuery}
              onPick={(id) => {
                setDest(id);
                go("route");
              }}
              onScan={() => setSheet({ kind: "scanSource" })}
              onSettings={() => go("settings")}
              onLanguage={() =>
                setPrefs({ lang: LANGS[(LANGS.indexOf(prefs.lang) + 1) % LANGS.length] })
              }
              onHelp={() => setSheet({ kind: "help" })}
            />
          )}
          {screen === "route" && dest && (
            <RouteScreen
              t={t}
              lang={prefs.lang}
              dest={dest}
              closures={closures}
              pace={prefs.pace}
              onBack={back}
              onStart={startNav}
              onAskVolunteer={(k) => sendRequest({ escort: k })}
            />
          )}
          {screen === "nav" && dest && nav && (
            <NavScreen
              t={t}
              lang={prefs.lang}
              dest={dest}
              nav={nav}
              pace={prefs.pace}
              audio={prefs.audio}
              haptic={prefs.haptic}
              speaking={fb.speaking}
              banner={banner}
              onToggleAudio={toggleAudio}
              onToggleHaptic={toggleHaptic}
              onNext={navigation.next}
              onBack={navigation.back}
              onHelp={() => setSheet({ kind: "help" })}
              onEnd={endNav}
            />
          )}
          {screen === "arrive" && arrival && (
            <ArriveScreen
              t={t}
              dest={arrival.dest}
              seconds={arrival.seconds}
              onNew={() => {
                setHistory([]);
                go("home", false);
              }}
            />
          )}
          {screen === "settings" && (
            <SettingsScreen t={t} prefs={prefs} onChange={changePrefs} onBack={back} />
          )}
        </div>

        {sheet?.kind === "help" && (
          <HelpSheet
            t={t}
            req={help.req}
            reason={helpReason}
            onReason={setHelpReason}
            onSend={() => sendRequest({ reason: helpReason })}
            onClose={closeHelp}
          />
        )}
        {sheet?.kind === "scanSource" && (
          <ScanSourceSheet
            t={t}
            onCamera={() => pickScanSource(cameraInput.current)}
            onLibrary={() => pickScanSource(libraryInput.current)}
            onClose={() => setSheet(null)}
          />
        )}
        {/* Kept mounted outside the sheet so the change event survives the sheet closing. */}
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          tabIndex={-1}
          aria-hidden="true"
          onChange={onLetterPicked}
        />
        <input
          ref={libraryInput}
          type="file"
          accept="image/*"
          hidden
          tabIndex={-1}
          aria-hidden="true"
          onChange={onLetterPicked}
        />
        {sheet?.kind === "choice" && (
          <ChoiceSheet
            t={t}
            closure={sheet.closure}
            hasDetour={sheet.alt !== null}
            extra={sheet.extra}
            onDetour={() => sheet.alt && takeDetour(sheet.closure, sheet.alt)}
            onVolunteer={() => sendRequest({ escort: sheet.closure })}
            onClose={() => setSheet(null)}
          />
        )}
        {scan && <ScanOverlay text={scan === "reading" ? t.scanning : t.found} />}
      </div>

      <p className={cx("phone-note")}>
        Routes follow Lakeridge Health&apos;s published visitor directions for the Oshawa
        hospital. The map is traced from Lakeridge&apos;s LHO site map; distances are
        estimates. Directions are spoken aloud when sound is on. Phones that support it
        vibrate for turn cues; everywhere else the phone shakes on screen.
      </p>
    </div>
  );
}
