// Icon path data (24×24, stroked), ported from the prototype's `P` table.
// Rendered by the <Icon> component: an <svg> with fill="none", stroke="currentColor",
// round caps and joins, and these paths as inner markup.

export const ICON_PATHS = {
  up: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
  down: '<path d="M12 4v15"/><path d="M6 13l6 6 6-6"/>',
  left: '<path d="M16 20v-7a4 4 0 0 0-4-4H5"/><path d="M9 5L5 9l4 4"/>',
  right:
    '<path d="M8 20v-7a4 4 0 0 1 4-4h7"/><path d="M15 5l4 4-4 4"/>',
  elev: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9.5 9.5L12 7l2.5 2.5"/><path d="M9.5 14.5L12 17l2.5-2.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3.5"/>',
  magnet:
    '<path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z"/><path d="M6 8h4M14 8h4"/>',
  atom: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-60 12 12)"/>',
  ribbon:
    '<path d="M12 3a3.5 3.5 0 0 0-3.5 3.5c0 2.4 1.7 4.6 3.5 6.6 1.8-2 3.5-4.2 3.5-6.6A3.5 3.5 0 0 0 12 3z"/><path d="M10 15l-3.5 6 3-1.2 1.5 2.7 2.3-4.5M14 15l3.5 6-3-1.2-1.5 2.7"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  pill: '<path d="M10.6 3.9a5 5 0 0 1 7.1 7.1l-6.7 6.7a5 5 0 0 1-7.1-7.1z"/><path d="M7.3 7.3l7 7"/>',
  heart:
    '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  settings:
    '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  fwd: '<path d="M9 5l7 7-7 7"/>',
  speaker:
    '<path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
  vibrate:
    '<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 8v8M20 8v8"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  skip: '<path d="M5 5l10 7-10 7z"/><path d="M19 5v14"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><path d="M12 17h.01"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  camera:
    '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  image:
    '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>',
  alert:
    '<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
} as const;

export type IconName = keyof typeof ICON_PATHS;

/** Preset size and stroke combinations used by the prototype's markup. */
export const ICON_ALIAS = {
  pin16: { name: "pin", size: 16 },
  pin40: { name: "pin", size: 44, stroke: 2.4 },
  elev48: { name: "elev", size: 52 },
  check64: { name: "check", size: 64, stroke: 2.6 },
} as const satisfies Record<string, { name: IconName; size: number; stroke?: number }>;
