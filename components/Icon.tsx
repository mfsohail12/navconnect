import { ICON_PATHS, type IconName } from "@/lib/navconnect/icons";

type IconProps = {
  name: IconName;
  size?: number;
  stroke?: number;
};

/** A stroked 24×24 icon from the prototype's icon set. Decorative: hidden from screen readers. */
export function Icon({ name, size = 20, stroke = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      // Static, trusted path data from lib/navconnect/icons.ts.
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  );
}

/** The NavConnect arrow mark. */
export function MarkIcon({ size = 16, stroke = 2.6 }: { size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5l7 18-7-4-7 4z" />
    </svg>
  );
}
