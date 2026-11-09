// Main-floor map with the route drawn on it. A JSX port of the prototype's mapSVG().

import type { CSSProperties } from "react";
import { FloorPlan } from "./FloorPlan";
import { DEST } from "@/lib/navconnect/destinations";
import type { Dictionary } from "@/lib/navconnect/i18n";
import { CLOSURE_MARKS, MAP_ARIA_LABEL, MAP_VIEWBOX } from "@/lib/navconnect/map";
import { CLOSURE_KEYS, ENTRANCE } from "@/lib/navconnect/routes";
import type { ClosureState, DestId, Point, Route } from "@/lib/navconnect/types";

const bodyFont: CSSProperties = { fontFamily: "var(--f-body)" };

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
      <FloorPlan labels={t.mapL} />

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
