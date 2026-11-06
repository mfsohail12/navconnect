// Main-floor map with the route drawn on it. A JSX port of the prototype's mapSVG().

import type { CSSProperties } from "react";
import { DEST } from "@/lib/navconnect/destinations";
import type { Dictionary } from "@/lib/navconnect/i18n";
import {
  CLOSURE_MARKS,
  COURT_LABELS,
  ELEVS,
  MAP_ARIA_LABEL,
  MAP_LABELS,
  MAP_VIEWBOX,
  WINGS,
} from "@/lib/navconnect/map";
import { CLOSURE_KEYS, ENTRANCE } from "@/lib/navconnect/routes";
import type { ClosureState, DestId, Point, Route } from "@/lib/navconnect/types";

const bodyFont: CSSProperties = { fontFamily: "var(--f-body)" };
const displayFont: CSSProperties = { fontFamily: "var(--f-display)" };

const points = (pts: readonly Point[]) => pts.map((p) => p.join(",")).join(" ");

/** Red ✕ marking a closure. */
function ClosedMark({ at: [x, y], size }: { at: Point; size: number }) {
  const r = size * 0.4;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={size} fill="var(--crit)" stroke="var(--surface)" strokeWidth={5} />
      <path
        d={`M-${r} -${r}L${r} ${r}M${r} -${r}L-${r} ${r}`}
        stroke="#fff"
        strokeWidth={7}
        strokeLinecap="round"
      />
    </g>
  );
}

type Props = {
  route: Route;
  dest: DestId;
  closures: ClosureState;
  t: Dictionary;
};

export function FloorMap({ route, dest, closures, t }: Props) {
  const lc = `var(--l-${DEST[dest].line})`;
  const end = route.path[route.path.length - 1];
  const pts = points(route.path);
  const [ex, ey] = ENTRANCE;

  return (
    <svg viewBox={MAP_VIEWBOX} direction="ltr" role="img" aria-label={MAP_ARIA_LABEL}>
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
          fill={w.color}
          fillOpacity={0.28}
          stroke={w.color}
          strokeOpacity={0.75}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ))}
      {WINGS.map(({ letter, color, badge: [x, y] }) => (
        <g key={letter} transform={`translate(${x} ${y})`}>
          <circle r={30} fill="var(--surface)" stroke={color} strokeWidth={4} />
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
        {t.mapL.food}
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
          {t.mapL.er}
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
          fill={color}
          stroke="var(--surface)"
          strokeWidth={4}
        >
          <title>{`${name} Elevator`}</title>
        </rect>
      ))}

      {CLOSURE_KEYS.filter((k) => closures[k]).map((k) => {
        const mark = CLOSURE_MARKS[k];
        return (
          <g key={k}>
            {mark.line && (
              <line
                x1={mark.line[0][0]}
                y1={mark.line[0][1]}
                x2={mark.line[1][0]}
                y2={mark.line[1][1]}
                stroke="var(--crit)"
                strokeWidth={12}
                strokeDasharray="16 14"
              />
            )}
            <ClosedMark at={mark.x} size={mark.size} />
          </g>
        );
      })}

      <polyline
        points={pts}
        fill="none"
        stroke="var(--surface)"
        strokeWidth={26}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={lc}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={pts}
        fill="none"
        stroke="var(--surface)"
        strokeWidth={5}
        strokeDasharray="4 22"
        strokeLinecap="round"
      >
        <animate attributeName="stroke-dashoffset" from="52" to="0" dur="1s" repeatCount="indefinite" />
      </polyline>

      <circle cx={ex} cy={ey} r={20} fill="var(--accent)" stroke="var(--surface)" strokeWidth={7} />
      <circle cx={ex} cy={ey} r={20} fill="none" stroke="var(--accent)" strokeWidth={4} opacity={0.5}>
        <animate attributeName="r" from="20" to="44" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" from=".6" to="0" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <text
        x={ex + 30}
        y={ey - 28}
        fontSize={24}
        fontWeight={700}
        fill="var(--accent)"
        style={bodyFont}
      >
        {t.mapL.entrance}
      </text>

      <g transform={`translate(${end[0]} ${end[1] - 14}) scale(2.4)`}>
        <path
          d="M0 6c-7-7-11-11-11-17a11 11 0 0 1 22 0c0 6-4 10-11 17z"
          fill={lc}
          stroke="var(--surface)"
          strokeWidth={2.5}
        />
        <circle cy={-11} r={4} fill="var(--surface)" />
      </g>
    </svg>
  );
}
