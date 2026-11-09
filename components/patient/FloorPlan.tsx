// The static main-floor plan (courts, wings, labels, elevators). Shared by the patient
// route map (<FloorMap>) and the staff heatmap. Render it inside an <svg> using MAP_VIEWBOX.

import type { CSSProperties } from "react";
import type { Dictionary } from "@/lib/navconnect/i18n";
import { COURT_LABELS, ELEVS, MAP_LABELS, WINGS } from "@/lib/navconnect/map";
import type { Point } from "@/lib/navconnect/types";

const bodyFont: CSSProperties = { fontFamily: "var(--f-body)" };
const displayFont: CSSProperties = { fontFamily: "var(--f-display)" };

const points = (pts: readonly Point[]) => pts.map((p) => p.join(",")).join(" ");

const MONO = "#8A8D90"; // sector D's grey

/** `mono` greys every wing and elevator (used behind the heatmap so only the heat has colour). */
export function FloorPlan({ labels, mono = false }: { labels: Dictionary["mapL"]; mono?: boolean }) {
  return (
    <>
      {COURT_LABELS.map(({ text, at: [x, y] }) => (
        <text
          key={text}
          x={x}
          y={y}
          fontSize={30}
          fill="var(--muted)"
          fontWeight={700}
          textAnchor="middle"
          style={bodyFont}
        >
          {text}
        </text>
      ))}

      {WINGS.map((w) => (
        <polygon
          key={w.letter}
          points={points(w.polygon)}
          fill={mono ? MONO : w.color}
          fillOpacity={mono ? 0.2 : 0.28}
          stroke={mono ? MONO : w.color}
          strokeOpacity={0.75}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ))}
      {WINGS.map(({ letter, color, badge: [x, y] }) => (
        <g key={letter} transform={`translate(${x} ${y})`}>
          <circle r={30} fill="var(--surface)" stroke={mono ? MONO : color} strokeWidth={4} />
          <text
            y={13}
            textAnchor="middle"
            fontSize={38}
            fontWeight={700}
            fill="var(--ink)"
            style={displayFont}
          >
            {letter}
          </text>
        </g>
      ))}

      <text
        x={MAP_LABELS.food[0]}
        y={MAP_LABELS.food[1]}
        fontSize={22}
        fill="var(--muted)"
        textAnchor="middle"
        style={bodyFont}
      >
        {labels.food}
      </text>
      <g transform={`translate(${MAP_LABELS.er[0]} ${MAP_LABELS.er[1]})`}>
        <rect x={-70} y={-20} width={140} height={34} rx={8} fill="var(--crit-soft)" />
        <text
          y={5}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          fill="var(--crit)"
          style={bodyFont}
        >
          {labels.er}
        </text>
      </g>

      {ELEVS.map(({ name, color, at: [x, y] }) => (
        <rect
          key={name}
          x={x - 11}
          y={y - 11}
          width={22}
          height={22}
          rx={4}
          fill={mono ? MONO : color}
          stroke="var(--surface)"
          strokeWidth={4}
        >
          <title>{`${name} Elevator`}</title>
        </rect>
      ))}
    </>
  );
}
