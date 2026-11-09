// The glowing path and arrow drawn over a backdrop, in the destination's line colour (--lc).
// The path lies on the floor in the same perspective as the corridor (see geometry.ts):
// straight down the middle past a landmark, or curving into a side passage or door.
// It is a separate layer so a real photo can replace the backdrop and keep the same guidance.

import type { ReactNode } from "react";
import { ICON_PATHS, type IconName } from "@/lib/navconnect/icons";
import type { Scene } from "@/lib/navconnect/scenes";
import { cx } from "../cx";
import { PASSAGE } from "./Backdrop";
import { HALF_WIDTH, Z_END, pr, pts, sign, wallPoint, type P, type Side } from "./geometry";

type XZ = readonly [number, number];

/** Points (x, z) along the path on the floor. */
function centreline(side: Side | undefined): XZ[] {
  const out: XZ[] = [];
  if (!side) {
    for (let z = 1.0; z <= Z_END - 0.25; z += 0.25) out.push([0, z]);
    return out;
  }
  // A quadratic curve from the visitor's feet to the middle of the passage or door.
  const s = sign(side);
  const zMid = (PASSAGE[0] + PASSAGE[1]) / 2;
  const p0: XZ = [0, 1.0];
  const p1: XZ = [s * 0.05, zMid - 1.2];
  const p2: XZ = [s * (HALF_WIDTH - 0.3), zMid - 0.05];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
  return out;
}

function tangent(line: XZ[], i: number): XZ {
  const a = line[Math.max(0, i - 1)];
  const b = line[Math.min(line.length - 1, i + 1)];
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz) || 1;
  return [dx / len, dz / len];
}

/** The path as a ribbon on the floor, narrowing a little with distance. */
function ribbon(line: XZ[]): string {
  const left: P[] = [];
  const right: P[] = [];
  line.forEach(([x, z], i) => {
    const [tx, tz] = tangent(line, i);
    const w = 0.5 - 0.18 * (i / (line.length - 1));
    left.push(pr(x - tz * w, 0, z + tx * w));
    right.push(pr(x + tz * w, 0, z - tx * w));
  });
  return pts([...left, ...right.reverse()]);
}

/** A chevron lying on the floor at line[i], pointing along the path. */
function chevron(line: XZ[], i: number): string {
  const [x, z] = line[i];
  const [tx, tz] = tangent(line, i);
  const shape: XZ[] = [
    [-0.25, -0.38],
    [0.15, 0],
    [-0.25, 0.38],
    [-0.52, 0.38],
    [-0.12, 0],
    [-0.52, -0.38],
  ];
  return pts(
    shape.map(([a, b]) => pr(x + a * tx - b * tz, 0.01, z + a * tz + b * tx)),
  );
}

function Badge({ at, icon, r = 32 }: { at: P; icon: IconName; r?: number }) {
  const [x, y] = at;
  const size = r * 1.15;
  return (
    <g className={cx("sc-pop")} style={{ transformOrigin: `${x}px ${y}px` }}>
      <circle cx={x} cy={y} r={r + 5} fill="#fff" opacity="0.8" />
      <circle cx={x} cy={y} r={r} fill="var(--lc)" />
      <g
        transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`}
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: ICON_PATHS[icon] }}
      />
    </g>
  );
}

function sideTarget(scene: Scene): Side | undefined {
  if (scene.turn) return scene.turn;
  if (scene.backdrop === "destDoor" && (scene.side === "left" || scene.side === "right")) {
    return scene.side;
  }
  return undefined;
}

export function PathOverlay({ scene }: { scene: Scene }) {
  const side = sideTarget(scene);
  const line = centreline(side);
  const picks = [0.3, 0.52, 0.76].map((f) => Math.round(f * (line.length - 1)));

  let badge: ReactNode = null;
  if (side) {
    const at = wallPoint(side, (PASSAGE[0] + PASSAGE[1]) / 2, 1.3);
    badge = scene.turn ? (
      // The "left" icon is mirrored for a right turn.
      <g transform={side === "right" ? `translate(${at[0] * 2} 0) scale(-1 1)` : undefined}>
        <Badge at={at} icon="left" r={36} />
      </g>
    ) : (
      <Badge at={at} icon="pin" />
    );
  } else if (scene.backdrop === "destDoor") {
    badge = <Badge at={[200, 282]} icon="pin" />;
  }

  return (
    <g>
      <polygon points={ribbon(line)} fill="var(--lc)" opacity="0.55" />
      {picks.map((i, n) => (
        <polygon
          key={i}
          className={cx("sc-chev")}
          style={{ animationDelay: `${n * 0.25}s` }}
          points={chevron(line, i)}
          fill="#fff"
          stroke="var(--lc)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      ))}
      {badge}
    </g>
  );
}
