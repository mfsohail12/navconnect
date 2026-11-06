import { Icon } from "@/components/Icon";
import { cx } from "../cx";

/** On-screen stand-in for vibration: the pattern as dots and dashes. */
export function HapticToast({ label, glyphs }: { label: string; glyphs: string }) {
  return (
    <div className={cx("hap-toast")} aria-hidden="true">
      <Icon name="vibrate" size={16} />
      <span>{label}</span>
      <span style={{ letterSpacing: ".15em" }}>{glyphs}</span>
    </div>
  );
}
