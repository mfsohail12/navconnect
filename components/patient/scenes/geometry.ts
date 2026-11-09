// A tiny perspective camera for the scene drawings. We stand in a corridor looking down it:
//   X = metres right of centre, Y = metres above the floor, Z = metres ahead.
// `pr()` turns that into a point in the 400 × 800 scene. Objects on the side walls, floor
// markings and the far wall are all projected the same way, so they line up.

export type P = readonly [number, number];
export type Side = "left" | "right";

const F = 360; // focal length
const VP_X = 200;
const VP_Y = 340; // horizon, centred in the band between the nav card (~230) and bottom sheet (~530)
const EYE = 1.5;
export const HALF_WIDTH = 1.4;
export const CEILING = 3;
/** Distance to the far wall. */
export const Z_END = 5.2;

export function pr(x: number, y: number, z: number): P {
  return [VP_X + (x * F) / z, VP_Y + ((EYE - y) * F) / z];
}

export function sign(side: Side): 1 | -1 {
  return side === "right" ? 1 : -1;
}

export function pts(points: readonly P[]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

/** A rectangle on a side wall: from z0 to z1 along the corridor, y0 to y1 up the wall. */
export function wall(side: Side, z0: number, z1: number, y0: number, y1: number): string {
  const x = sign(side) * HALF_WIDTH;
  return pts([pr(x, y1, z0), pr(x, y1, z1), pr(x, y0, z1), pr(x, y0, z0)]);
}

/** A point on a side wall, for building circles and other shapes. */
export function wallPoint(side: Side, z: number, y: number): P {
  return pr(sign(side) * HALF_WIDTH, y, z);
}

/** A rectangle on the far wall (or any plane facing us at depth z). */
export function facing(x0: number, x1: number, y0: number, y1: number, z: number): string {
  return pts([pr(x0, y1, z), pr(x1, y1, z), pr(x1, y0, z), pr(x0, y0, z)]);
}

export type BoxFaces = { top: string; inner: string; front: string };

/**
 * A box standing against a side wall, protruding `depth` metres into the corridor.
 * Returns the three faces we can see, to draw back to front: top, inner side, front.
 */
export function box(
  side: Side,
  depth: number,
  z0: number,
  z1: number,
  y0: number,
  y1: number,
): BoxFaces {
  const s = sign(side);
  const xo = s * HALF_WIDTH;
  const xi = s * (HALF_WIDTH - depth);
  return {
    top: pts([pr(xi, y1, z0), pr(xo, y1, z0), pr(xo, y1, z1), pr(xi, y1, z1)]),
    inner: pts([pr(xi, y1, z0), pr(xi, y1, z1), pr(xi, y0, z1), pr(xi, y0, z0)]),
    front: pts([pr(xi, y1, z0), pr(xo, y1, z0), pr(xo, y0, z0), pr(xi, y0, z0)]),
  };
}

/** A flat shape on the floor, from (x, z) points. */
export function floorShape(points: readonly (readonly [number, number])[]): string {
  return pts(points.map(([x, z]) => pr(x, 0, z)));
}
