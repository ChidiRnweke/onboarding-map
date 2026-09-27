import { CORNER, JUMP, TAU, pt } from './constants';

/**
 * One step of the route, from one waypoint angle to the next. Short hops run
 * along the track just inside the leaf ring with rounded corners; long ones cut
 * across the middle, because following the rim would be a near-circumnavigation.
 */
export function hop(a0: number, a1: number, track: number, leafR: number): string {
  let delta = a1 - a0;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;

  if (Math.abs(delta) > JUMP) {
    const depth = track * (0.75 - 0.4 * (Math.abs(delta) / Math.PI));
    return ` C${pt(a0, depth)} ${pt(a1, depth)} ${pt(a1, leafR)}`;
  }

  let d = ` L${pt(a0, track + CORNER)}`;
  const dir = Math.sign(delta) || 1;
  const da = CORNER / track;

  if (Math.abs(delta) > da * 2) {
    d += ` Q${pt(a0, track)} ${pt(a0 + dir * da, track)}`;
    const large = Math.abs(delta) - 2 * da > Math.PI ? 1 : 0;
    d += ` A${track},${track} 0 ${large} ${dir > 0 ? 1 : 0} ${pt(a1 - dir * da, track)}`;
    d += ` Q${pt(a1, track)} ${pt(a1, track + CORNER)}`;
  } else {
    d += ` Q${pt((a0 + a1) / 2, track - 4)} ${pt(a1, track + CORNER)}`;
  }

  return d + ` L${pt(a1, leafR)}`;
}
