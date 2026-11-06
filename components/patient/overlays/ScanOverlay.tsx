import { cx } from "../cx";

const LINES = [
  { top: "10%", width: "40%" },
  { top: "22%", width: "62%", hl: true },
  { top: "34%", width: "70%" },
  { top: "42%", width: "55%" },
  { top: "54%", width: "46%", hl: true },
  { top: "66%", width: "72%" },
  { top: "74%", width: "60%" },
];

/** Simulated appointment-letter scan (no real camera or OCR). */
export function ScanOverlay({ text }: { text: string }) {
  return (
    <div className={cx("scan-ov")} role="status">
      <div className={cx("vf")} aria-hidden="true">
        {LINES.map((l, i) => (
          <span key={i} className={cx("ln", l.hl && "hl")} style={{ top: l.top, width: l.width }} />
        ))}
        <span className={cx("beam")} />
      </div>
      <p>{text}</p>
    </div>
  );
}
