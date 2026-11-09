"use client";

// Staff heatmap: the main-floor plan with a glow at each destination sized and tinted by its
// visit count. Hover (or focus / tap) a location to see the exact number of visits.

import { useState, type CSSProperties } from "react";
import { FloorPlan } from "@/components/patient/FloorPlan";
import { ORDER } from "@/lib/navconnect/destinations";
import { I } from "@/lib/navconnect/i18n";
import { HEAT_SPOTS, MAP_VIEWBOX } from "@/lib/navconnect/map";
import type { DestId } from "@/lib/navconnect/types";
import styles from "./heat-map.module.css";

const [VX, VY, VW, VH] = MAP_VIEWBOX.split(" ").map(Number);

const LABEL_H = 32;
const labelWidth = (text: string) => Math.round(text.length * 12 + 20);

function labelBox(id: DestId, w: number) {
  const {
    at: [x, y],
    label,
  } = HEAT_SPOTS[id];
  switch (label) {
    case "left":
      return { x: x - 18 - w, y: y - LABEL_H / 2 };
    case "right":
      return { x: x + 18, y: y - LABEL_H / 2 };
    case "above":
      return { x: x - w / 2, y: y - 18 - LABEL_H };
    default:
      return { x: x - w / 2, y: y + 18 };
  }
}

export function HeatMap({ counts }: { counts: Partial<Record<DestId, number>> }) {
  const [active, setActive] = useState<DestId | null>(null);
  const max = Math.max(1, ...ORDER.map((id) => counts[id] ?? 0));
  const visits = (id: DestId) => counts[id] ?? 0;

  const activeSpot = active ? HEAT_SPOTS[active] : null;
  const tip = activeSpot && active
    ? {
        left: `${(((activeSpot.at[0] - VX) / VW) * 100).toFixed(2)}%`,
        top: `${(((activeSpot.at[1] - VY) / VH) * 100).toFixed(2)}%`,
        below: activeSpot.at[1] - VY < VH * 0.3,
      }
    : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.map}>
        <svg
          viewBox={MAP_VIEWBOX}
          direction="ltr"
          role="group"
          aria-label="Heatmap of visits to each destination on the main floor"
        >
          <FloorPlan labels={I.en.mapL} mono />

          {/* Glows first so every dot and label sits above them. */}
          {ORDER.map((id) => {
            const n = visits(id);
            if (!n) return null;
            const [x, y] = HEAT_SPOTS[id].at;
            const heat = n / max;
            // Area grows with visits, so busier places read as clearly bigger and darker.
            const r = 26 + 54 * Math.sqrt(heat);
            return (
              <circle
                key={id}
                cx={x}
                cy={y}
                r={r}
                className={styles.glow}
                fillOpacity={0.2 + 0.6 * heat}
                strokeOpacity={0.5 + 0.5 * heat}
                pointerEvents="none"
              />
            );
          })}

          {ORDER.map((id) => {
            const [x, y] = HEAT_SPOTS[id].at;
            const name = I.en.dest[id];
            const short = HEAT_SPOTS[id].short;
            const w = labelWidth(short);
            const box = labelBox(id, w);
            const on = active === id;
            return (
              <g
                key={id}
                className={styles.spot}
                data-active={on || undefined}
                tabIndex={0}
                role="img"
                aria-label={`${name}: ${visits(id)} visits`}
                onMouseEnter={() => setActive(id)}
                onMouseLeave={() => setActive((a) => (a === id ? null : a))}
                onFocus={() => setActive(id)}
                onBlur={() => setActive((a) => (a === id ? null : a))}
                onClick={() => setActive((a) => (a === id ? null : id))}
              >
                {/* Generous invisible hit area. */}
                <circle cx={x} cy={y} r={44} fill="transparent" />
                <rect
                  x={box.x}
                  y={box.y}
                  width={w}
                  height={LABEL_H}
                  rx={LABEL_H / 2}
                  className={styles.pill}
                />
                <text
                  x={box.x + w / 2}
                  y={box.y + LABEL_H / 2 + 7.5}
                  textAnchor="middle"
                  fontSize={21}
                  fontWeight={700}
                  className={styles.name}
                >
                  {short}
                </text>
                <circle cx={x} cy={y} r={on ? 13 : 10} className={styles.dot} />
              </g>
            );
          })}
        </svg>

        {tip && active && (
          <div
            className={styles.tip}
            data-below={tip.below || undefined}
            style={{ left: tip.left, top: tip.top } as CSSProperties}
            role="status"
          >
            <strong>{I.en.dest[active]}</strong>
            <span>
              {visits(active)} {visits(active) === 1 ? "visit" : "visits"}
            </span>
          </div>
        )}
      </div>

      <div className={styles.legend} aria-hidden="true">
        <span>Fewer visits</span>
        <i />
        <span>More visits</span>
      </div>
    </div>
  );
}
