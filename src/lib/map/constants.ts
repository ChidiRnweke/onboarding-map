export const TAU = Math.PI * 2;

/** Base radii of the map, in map units. Scaled up by computePositions when crowded. */
export const BASE_R = {
  cat: 300,
  leaf: 468,
  wedgeIn: 190,
  wedgeOut: 648,
  region: 690,
  extent: 760,
};

export type Radii = typeof BASE_R;

/** Minimum arc length per leaf on the leaf ring, in map units. */
export const SLOT_PX = 18.5;
export const GAP_CAT = 1.6;
export const GAP_DOMAIN = 3.4;

/** The route track sits this far inside the leaf ring; brackets 30 further in. */
export const TRACK_INSET = 40;
export const BRACKET_INSET = 70;

/** Hops wider than JUMP cut across the middle instead of running around the ring. */
export const JUMP = (55 * Math.PI) / 180;
export const CORNER = 12;

/** Polar to cartesian, with 0 at 12 o'clock and angles running clockwise. */
export function xy(a: number, r: number): [number, number] {
  return [r * Math.sin(a), -r * Math.cos(a)];
}

/** A rounded "x,y" pair for building path strings. */
export function pt(a: number, r: number): string {
  return xy(a, r)
    .map((v) => +v.toFixed(2))
    .join(',');
}
