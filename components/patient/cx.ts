import styles from "./patient.module.css";

/**
 * Class names for the patient app, using the prototype's names.
 * `cx("btn", "btn-primary", isOn && "on")` → the matching CSS-module class names.
 */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names
    .filter((n): n is string => Boolean(n))
    .map((n) => styles[n] ?? n)
    .join(" ");
}
