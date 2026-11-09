// Flat, first-person illustrations of each place on the routes: a corridor in real
// perspective (see geometry.ts) with the landmark either
//   - on a side wall, for "continue past X" steps (SideProps.tsx),
//   - at the far end, for elevators, escalators and the destination door (FrontProps.tsx), or
//   - behind a side passage, for turns.
// All drawings use a 400 × 800 viewBox, so they line up with PathOverlay.
//
// To use real photos later, render an <image> (or <img>) for the backdrop instead.

import type { ReactNode } from "react";
import type { Scene } from "@/lib/navconnect/scenes";
import {
  AWingHall,
  DestDoor,
  ElevatorDoors,
  Escalator,
  FoodCourt,
  GWing,
  YellowElevator,
} from "./FrontProps";
import {
  CEILING,
  HALF_WIDTH,
  Z_END,
  facing,
  pr,
  pts,
  wall,
  type Side,
} from "./geometry";
import { SIDE_RANGE, SideProp } from "./SideProps";

const ELEVATOR_COLOR = { purple: "#7b4bb7", grey: "#8a949e" } as const;

/** Front props are drawn 210 tall with their base at y = 500; scale them onto the far wall. */
const FAR_BOTTOM = pr(0, 0, Z_END)[1];
const FAR_TOP = pr(0, CEILING, Z_END)[1];
const HERO_SCALE = (FAR_BOTTOM - FAR_TOP) / 210;

/** Where the generic office doors sit along each wall (z0, z1). */
const DOOR_SLOTS: readonly (readonly [number, number])[] = [
  [2.7, 3.4],
  [4.3, 4.95],
];

/** Where a turn's side passage is, and where a side door for the destination is. */
export const PASSAGE: readonly [number, number] = [3.3, 5.0];

type Occupied = { left?: readonly [number, number]; right?: readonly [number, number] };

function overlaps(a: readonly [number, number], b?: readonly [number, number]): boolean {
  return !!b && a[0] < b[1] && b[0] < a[1];
}

function Corridor({ occupied, farEnd }: { occupied: Occupied; farEnd: boolean }) {
  const hw = HALF_WIDTH;
  const tiles = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  return (
    <g>
      <rect width="400" height="800" fill="var(--ar-back)" />
      {/* ceiling, walls, floor */}
      <polygon points={pts([pr(-9, CEILING, 1), pr(9, CEILING, 1), pr(hw, CEILING, Z_END), pr(-hw, CEILING, Z_END)])} fill="var(--ar-ceil)" />
      <polygon points={wall("left", 0.6, Z_END, 0, CEILING)} fill="var(--ar-wl)" />
      <polygon points={wall("right", 0.6, Z_END, 0, CEILING)} fill="var(--ar-wr)" />
      <polygon points={pts([pr(-hw, 0, 0.6), pr(hw, 0, 0.6), pr(hw, 0, Z_END), pr(-hw, 0, Z_END)])} fill="var(--ar-floor)" />
      {/* floor tile lines give a sense of distance */}
      {tiles.map((z) => (
        <polyline key={z} points={pts([pr(-hw, 0, z), pr(hw, 0, z)])} stroke="#98a3ac" strokeWidth="1.5" opacity="0.7" fill="none" />
      ))}
      {/* far wall */}
      <polygon points={facing(-hw, hw, 0, CEILING, Z_END)} fill="#c4ced6" />
      {farEnd && <FarEnd />}
      {/* ceiling lights */}
      {[2.2, 3.4, 4.6].map((z) => (
        <polygon key={z} points={pts([pr(-0.45, CEILING, z), pr(0.45, CEILING, z), pr(0.45, CEILING, z + 0.5), pr(-0.45, CEILING, z + 0.5)])} fill="var(--ar-light)" />
      ))}
      {/* generic office doors and a handrail, except where a landmark or passage is */}
      {(["left", "right"] as const).map((side) => (
        <g key={side}>
          <polygon points={wall(side, 0.6, Z_END, 0.85, 0.93)} fill="#b3bdc6" />
          {DOOR_SLOTS.filter((slot) => !overlaps(slot, occupied[side])).map(([z0, z1]) => (
            <polygon key={z0} points={wall(side, z0, z1, 0, 2.1)} fill="var(--ar-door)" opacity="0.95" />
          ))}
        </g>
      ))}
      {/* skirting along the floor edges */}
      <polyline points={pts([pr(-hw, 0, 0.6), pr(-hw, 0, Z_END)])} stroke="#8d98a2" strokeWidth="3" fill="none" />
      <polyline points={pts([pr(hw, 0, 0.6), pr(hw, 0, Z_END)])} stroke="#8d98a2" strokeWidth="3" fill="none" />
    </g>
  );
}

/** The far end when no landmark is there: a pair of doors with light behind them. */
function FarEnd() {
  return (
    <g>
      <polygon points={facing(-0.62, 0.62, 0, 2.3, Z_END)} fill="#6b7a87" />
      <polygon points={facing(-0.54, -0.03, 0.05, 2.2, Z_END)} fill="#e7f3fa" />
      <polygon points={facing(0.03, 0.54, 0.05, 2.2, Z_END)} fill="#e7f3fa" />
    </g>
  );
}

/** A side passage in the wall, where a turn leads. */
function Passage({ side }: { side: Side }) {
  return (
    <g>
      <polygon points={wall(side, PASSAGE[0], PASSAGE[1], 0, 2.4)} fill="#7f8c98" />
      <polygon points={wall(side, PASSAGE[0] + 0.25, PASSAGE[1] - 0.2, 0, 2.2)} fill="#b4bfc8" />
      <polygon points={wall(side, PASSAGE[0], PASSAGE[1], 2.4, 2.55)} fill="var(--lc)" />
    </g>
  );
}

/** The destination door on a side wall. */
function SideDoor({ side }: { side: Side }) {
  return (
    <g>
      <polygon points={wall(side, PASSAGE[0] - 0.1, PASSAGE[1] - 0.2, 0, 2.3)} fill="#5d6b78" />
      <polygon points={wall(side, PASSAGE[0] + 0.05, PASSAGE[1] - 0.35, 0, 2.15)} fill="#e8d2ad" />
      <polygon points={wall(side, PASSAGE[0] + 0.25, PASSAGE[1] - 0.75, 1.25, 1.9)} fill="#cfe6f3" />
      <polygon points={wall(side, PASSAGE[0] - 0.1, PASSAGE[1] - 0.2, 2.3, 2.5)} fill="var(--lc)" />
    </g>
  );
}

function FarHero({ scene }: { scene: Scene }): ReactNode {
  switch (scene.backdrop) {
    case "aWing":
      return <AWingHall />;
    case "foodCourt":
      return <FoodCourt />;
    case "yellowElevator":
      return <YellowElevator />;
    case "gWing":
      return <GWing />;
    case "elevator":
      return (
        <ElevatorDoors
          color={ELEVATOR_COLOR[scene.elevator ?? "grey"]}
          display={scene.floor !== undefined ? String(scene.floor) : undefined}
        />
      );
    case "escalator":
      return <Escalator />;
    case "destDoor":
      return <DestDoor />;
    default:
      return null;
  }
}

export function Backdrop({ scene }: { scene: Scene }) {
  const wallSide = scene.wallSide;
  const doorSide: Side | undefined =
    scene.backdrop === "destDoor" && (scene.side === "left" || scene.side === "right")
      ? scene.side
      : undefined;
  const passageSide = scene.turn;

  const occupied: Occupied = {};
  if (wallSide) occupied[wallSide] = SIDE_RANGE;
  if (passageSide) occupied[passageSide] = PASSAGE;
  if (doorSide) occupied[doorSide] = PASSAGE;

  const hasFarHero = !wallSide && !doorSide;
  return (
    <g>
      <Corridor occupied={occupied} farEnd={!hasFarHero} />
      {hasFarHero && (
        <g transform={`translate(200 ${FAR_BOTTOM}) scale(${HERO_SCALE}) translate(-200 -500)`}>
          <FarHero scene={scene} />
        </g>
      )}
      {wallSide && <SideProp id={scene.backdrop} side={wallSide} />}
      {passageSide && <Passage side={passageSide} />}
      {doorSide && <SideDoor side={doorSide} />}
    </g>
  );
}
