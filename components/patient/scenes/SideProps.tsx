// Landmarks mounted on a side wall, seen in perspective, for "continue past X" steps.
// The path runs down the middle of the corridor, so the landmark is beside the visitor as
// they pass it. Everything is positioned in metres with the helpers in geometry.ts:
// z is distance along the corridor, y is height above the floor.

import type { ReactNode, SVGProps } from "react";
import type { BackdropId } from "@/lib/navconnect/scenes";
import { box, pr, pts, sign, wall, wallPoint, type Side } from "./geometry";

/** The wall range (z0, z1) the landmarks occupy, so generic doors don't overlap them. */
export const SIDE_RANGE: readonly [number, number] = [2.5, 5.4];

type CircleProps = { side: Side; z: number; y: number; r: number } & SVGProps<SVGPolygonElement>;

/** A circle drawn on the wall (squashed by perspective). */
function Circle({ side, z, y, r, ...rest }: CircleProps) {
  const points = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return wallPoint(side, z + r * Math.cos(a), y + r * Math.sin(a));
  });
  return <polygon points={pts(points)} {...rest} />;
}

/**
 * A revolving door seen from outside, after the hospital's entrance: a glass drum under a
 * dark steel canopy, with a steel column and radial glass leaves inside, set into a glass
 * wall and sitting on a round entrance mat.
 */
function Revolving({ side }: { side: Side }) {
  const s = sign(side);
  const cx = s * 1.3; // drum centre, partly in the wall line so the path stays clear
  const cz = 4.3;
  const r = 0.85;
  const top = 2.4;
  const N = 40;
  const at = (a: number, rad: number, y: number) =>
    pr(cx + rad * Math.cos(a), y, cz + rad * Math.sin(a));
  const ring = (rad: number, y: number) =>
    pts(Array.from({ length: N }, (_, i) => at((i / N) * Math.PI * 2, rad, y)));

  // The half of the drum facing the visitor (smaller z).
  const front = Array.from({ length: N / 2 }, (_, i) => Math.PI + (i / (N / 2)) * Math.PI);
  const step = Math.PI / (N / 2);
  const leaves = [Math.PI * 0.17, Math.PI * 0.83, Math.PI * 1.5].sort((a, b) => Math.sin(b) - Math.sin(a));
  const posts = [Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75, Math.PI * 2];
  const mullions = Array.from({ length: 7 }, (_, i) => 2.65 + i * 0.4);

  return (
    <g>
      {/* glass wall on either side of the drum */}
      <polygon points={wall(side, 2.6, 5.3, 0, 2.95)} fill="#6e7c89" />
      <polygon points={wall(side, 2.68, 5.22, 0.08, 2.55)} fill="#a9c4d6" />
      {mullions.map((z) => (
        <polygon key={z} points={wall(side, z, z + 0.05, 0.08, 2.55)} fill="#6e7c89" />
      ))}
      <polygon points={wall(side, 2.6, 5.3, 2.55, 2.95)} fill="var(--lc)" />

      {/* round entrance mat */}
      <polygon points={ring(r + 0.3, 0)} fill="#3a4147" />
      <polygon points={ring(r + 0.15, 0)} fill="#2d3338" />

      {/* inside: dark underside of the canopy, steel column and glass door leaves */}
      <polygon points={ring(r, top)} fill="#2c3640" />
      {leaves.map((a) => (
        <polygon
          key={a}
          points={pts([at(a, 0.05, 0.05), at(a, r * 0.92, 0.05), at(a, r * 0.92, top - 0.15), at(a, 0.05, top - 0.15)])}
          fill="#dcecf6"
          fillOpacity="0.55"
          stroke="#5b6773"
          strokeWidth="2.5"
        />
      ))}
      <polygon
        points={pts([pr(cx - 0.24, 0, cz), pr(cx + 0.24, 0, cz), pr(cx + 0.24, top, cz), pr(cx - 0.24, top, cz)])}
        fill="#9aa8b5"
        stroke="#6e7c89"
        strokeWidth="2"
      />
      <polygon
        points={pts([pr(cx - 0.24, 0, cz), pr(cx - 0.05, 0, cz), pr(cx - 0.05, top, cz), pr(cx - 0.24, top, cz)])}
        fill="#fff"
        opacity="0.25"
      />

      {/* curved glass wall of the drum, front half */}
      {front.map((a) => (
        <polygon
          key={a}
          points={pts([at(a, r, 0), at(a + step, r, 0), at(a + step, r, top), at(a, r, top)])}
          fill="#bcd9ea"
          fillOpacity="0.32"
        />
      ))}
      {posts.map((a) => (
        <polyline
          key={a}
          points={pts([at(a, r, 0), at(a, r, top)])}
          stroke="#5b6773"
          strokeWidth="3.5"
          fill="none"
        />
      ))}

      {/* steel canopy band around the top */}
      {front.map((a) => (
        <polygon
          key={a}
          points={pts([at(a, r + 0.04, top - 0.05), at(a + step, r + 0.04, top - 0.05), at(a + step, r + 0.04, top + 0.3), at(a, r + 0.04, top + 0.3)])}
          fill="#6b7885"
          stroke="#8996a3"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

function GiftShop({ side }: { side: Side }) {
  const awning = [0, 1, 2, 3, 4, 5];
  const seg = (5.4 - 2.6) / awning.length;
  return (
    <g>
      <polygon points={wall(side, 2.6, 5.4, 0, 2.95)} fill="#efe3d3" />
      <polygon points={wall(side, 2.95, 5.2, 0.3, 2.0)} fill="#fbf6ee" stroke="#c9b79f" strokeWidth="3" />
      {awning.map((i) => (
        <polygon
          key={i}
          points={wall(side, 2.6 + i * seg, 2.6 + (i + 1) * seg, 2.05, 2.6)}
          fill={i % 2 ? "#fff" : "#d2335f"}
        />
      ))}
      <polygon points={wall(side, 2.6, 5.4, 2.6, 2.95)} fill="#4a3a2b" />
      {/* gifts in the window */}
      <polygon points={wall(side, 3.15, 3.7, 0.3, 0.85)} fill="#f2a93b" />
      <polygon points={wall(side, 3.38, 3.47, 0.3, 0.85)} fill="#d2335f" />
      <polygon points={wall(side, 3.9, 4.35, 0.3, 1.2)} fill="#2b9646" />
      <polygon points={wall(side, 4.08, 4.17, 0.3, 1.2)} fill="#fff" />
      <Circle side={side} z={4.85} y={0.65} r={0.35} fill="#5b8dff" />
      <polygon points={wall(side, 2.95, 5.2, 0.3, 0.36)} fill="#c9b79f" />
    </g>
  );
}

function Coffee({ side }: { side: Side }) {
  const counter = box(side, 0.85, 2.85, 4.7, 0, 1.05);
  const machine = box(side, 0.35, 3.3, 3.95, 1.05, 1.55);
  const cupA = box(side, 0.22, 4.15, 4.3, 1.05, 1.22);
  const cupB = box(side, 0.22, 4.4, 4.55, 1.05, 1.22);
  const cup = [
    wallPoint(side, 3.75, 1.85),
    wallPoint(side, 4.05, 1.85),
    wallPoint(side, 4.0, 2.2),
    wallPoint(side, 3.8, 2.2),
  ];
  return (
    <g>
      <polygon points={wall(side, 2.6, 5.1, 0, 2.95)} fill="#efe3d3" />
      {/* menu board with a cup */}
      <polygon points={wall(side, 3.0, 4.8, 1.65, 2.55)} fill="#2f3a44" />
      <polygon points={pts(cup)} fill="#fff" />
      <polygon points={wall(side, 4.2, 4.65, 2.2, 2.28)} fill="#f2a93b" />
      <polygon points={wall(side, 4.2, 4.55, 2.02, 2.1)} fill="#f2a93b" />
      <polygon points={wall(side, 4.2, 4.6, 1.84, 1.92)} fill="#f2a93b" />
      {/* canopy */}
      <polygon points={wall(side, 2.6, 5.1, 1.55, 1.68)} fill="#6b4a2f" />
      <polygon points={wall(side, 2.6, 5.1, 2.55, 2.95)} fill="#6b4a2f" />
      {/* counter, machine and cups */}
      <polygon points={counter.top} fill="#c58b57" />
      <polygon points={counter.inner} fill="#7a4d2c" />
      <polygon points={counter.front} fill="#8a5a36" />
      <polygon points={machine.top} fill="#4b5762" />
      <polygon points={machine.inner} fill="#2f3a44" />
      <polygon points={machine.front} fill="#3a4651" />
      <polygon points={cupA.inner} fill="#fff" />
      <polygon points={cupA.front} fill="#e8e8e8" />
      <polygon points={cupB.inner} fill="#fff" />
      <polygon points={cupB.front} fill="#e8e8e8" />
    </g>
  );
}

function BlueElevator({ side }: { side: Side }) {
  return (
    <g>
      <polygon points={wall(side, 2.8, 4.9, 0, 2.95)} fill="#dfe6ec" />
      <polygon points={wall(side, 2.85, 4.85, 0, 2.45)} fill="#4b5762" />
      <polygon points={wall(side, 2.97, 4.73, 0, 2.3)} fill="#2f6fd6" />
      <polygon points={wall(side, 2.97, 3.85, 0, 2.3)} fill="#fff" opacity="0.14" />
      <polygon points={wall(side, 3.83, 3.87, 0, 2.3)} fill="#1c3f80" />
      <polygon points={wall(side, 3.4, 4.3, 2.5, 2.68)} fill="#10161c" />
      <polygon points={wall(side, 3.8, 3.9, 2.55, 2.63)} fill="#7dffb2" />
      <polygon points={wall(side, 5.0, 5.1, 0.95, 1.35)} fill="#f2f2f2" stroke="#8d98a2" strokeWidth="1.5" />
      <polygon points={wall(side, 2.8, 4.9, 2.72, 2.95)} fill="#2f6fd6" />
    </g>
  );
}

function CancerCentre({ side }: { side: Side }) {
  return (
    <g>
      <polygon points={wall(side, 2.6, 5.3, 0, 2.95)} fill="#f1ecf6" />
      <polygon points={wall(side, 2.6, 5.3, 2.45, 2.95)} fill="#7b4bb7" />
      <Circle side={side} z={3.0} y={2.7} r={0.17} fill="#fff" />
      <polygon
        points={pts([
          wallPoint(side, 3.0, 2.78),
          wallPoint(side, 3.08, 2.62),
          wallPoint(side, 3.0, 2.58),
          wallPoint(side, 2.92, 2.62),
        ])}
        fill="#e0457b"
      />
      {/* glass entrance */}
      <polygon points={wall(side, 2.75, 4.15, 0, 2.3)} fill="#5d6b78" />
      <polygon points={wall(side, 2.85, 4.05, 0, 2.2)} fill="#cfe6f3" />
      <polygon points={wall(side, 3.43, 3.47, 0, 2.2)} fill="#5d6b78" />
      {/* purple elevator beside it */}
      <polygon points={wall(side, 4.45, 5.15, 0, 2.2)} fill="#7b4bb7" />
      <polygon points={wall(side, 4.78, 4.82, 0, 2.2)} fill="#4d2c7a" />
    </g>
  );
}

function CWingDoors({ side }: { side: Side }) {
  return (
    <g>
      <polygon points={wall(side, 2.7, 4.8, 0, 2.95)} fill="#dfe8ee" />
      <polygon points={wall(side, 2.7, 4.8, 2.5, 2.95)} fill="#0a8282" />
      <polygon points={wall(side, 2.85, 3.73, 0, 2.25)} fill="#b6d3e6" stroke="#5d6b78" strokeWidth="3" />
      <polygon points={wall(side, 3.77, 4.65, 0, 2.25)} fill="#b6d3e6" stroke="#5d6b78" strokeWidth="3" />
      <polygon points={wall(side, 2.98, 3.6, 1.2, 2.05)} fill="#e7f3fa" />
      <polygon points={wall(side, 3.9, 4.52, 1.2, 2.05)} fill="#e7f3fa" />
      <polygon points={wall(side, 3.6, 3.68, 0.85, 1.15)} fill="#5d6b78" />
      <polygon points={wall(side, 3.82, 3.9, 0.85, 1.15)} fill="#5d6b78" />
    </g>
  );
}

export function SideProp({ id, side }: { id: BackdropId; side: Side }): ReactNode {
  switch (id) {
    case "revolving":
      return <Revolving side={side} />;
    case "giftShop":
      return <GiftShop side={side} />;
    case "coffee":
      return <Coffee side={side} />;
    case "blueElevator":
      return <BlueElevator side={side} />;
    case "cancerCentre":
      return <CancerCentre side={side} />;
    case "cWing":
      return <CWingDoors side={side} />;
    default:
      return null;
  }
}
