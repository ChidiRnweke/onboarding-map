import { arc } from 'd3-shape';
import type { DerivedDomain, DerivedMap, DerivedNode, NodeStatus } from '$core/model';
import {
  BASE_R,
  BRACKET_INSET,
  GAP_CAT,
  GAP_DOMAIN,
  SLOT_PX,
  TAU,
  TRACK_INSET,
  type Radii,
  pt,
  xy,
} from './constants';
import { hop } from './route';

export type View = 'focus' | 'full';

export interface Placement {
  node: DerivedNode;
  a: number;
  r: number;
  x: number;
  y: number;
  /** Labels past half a turn read right-to-left, so they flip to the other side. */
  flip: boolean;
  /** 1 when fully shown; between 0 and 1 while a view change fades it in or out. */
  presence: number;
}

export interface LeafPlacement extends Placement {
  /** Stage order when this leaf is a waypoint on the route, else null. */
  waypoint: number | null;
}

export interface CategoryPlacement extends Placement {
  /** Angular span of the bracket drawn over the category's items. */
  a0: number;
  a1: number;
  bracket: string;
}

export interface DomainPlacement {
  domain: DerivedDomain;
  presence: number;
  wedge: string;
  /** Path the region name is set along; referenced from <defs> by id. */
  rimId: string;
  rim: string;
  /** Angles the rim arc runs between, for setting a name on more than one line. */
  a0: number;
  a1: number;
  /** Length of the rim arc in map units: the room the name has along the rim. */
  rimLength: number;
}

export interface RouteSegment {
  order: number;
  d: string;
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Grid {
  rings: number[];
  spokes: Line[];
  ticks: Line[];
  rimOuter: number;
  rimInner: number;
}

export interface Layout {
  R: Radii;
  track: number;
  domains: DomainPlacement[];
  categories: CategoryPlacement[];
  leaves: LeafPlacement[];
  /** Every placed node, leaf or category, for drawing relations between them. */
  byId: Record<string, Placement>;
  route: RouteSegment[];
  grid: Grid;
  /**
   * The room a region name has across the rim: from the wedges' outer edge to
   * the outer ring, whose ticks point outward from it.
   */
  band: { inner: number; outer: number };
}

const statusRank: Record<NodeStatus, number> = { path: 0, alternative: 1, context: 2 };

const range = (start: number, stop: number, step: number): number[] => {
  const out: number[] = [];
  for (let v = start; v < stop; v += step) out.push(v);
  return out;
};

/** Region names on the lower half are flipped so they still read left to right. */
export const isLowerHalf = (a0: number, a1: number): boolean => {
  const mid = (a0 + a1) / 2;
  return mid > Math.PI / 2 && mid < Math.PI * 1.5;
};

export const rimArc = (a0: number, a1: number, r: number): string => {
  const lower = isLowerHalf(a0, a1);
  const [from, to] = lower ? [a1, a0] : [a0, a1];
  const [x0, y0] = xy(from, r);
  const [x1, y1] = xy(to, r);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M${x0},${y0} A${r},${r} 0 ${large} ${lower ? 0 : 1} ${x1},${y1}`;
};

/**
 * Where everything sits, before any of it is drawn: the ring radii and an angle
 * and presence for every node and region in the map, visible or not.
 *
 * Hidden items still get an angle — the gap they would grow out of — with
 * presence 0. That is what lets two views be blended into each other: an item
 * the new view adds unfolds from where it belongs instead of appearing from
 * nowhere, and one it removes folds back into its neighbours.
 */
export interface Positions {
  R: Radii;
  /** Angular width of one slot, and the half-gap a region's wedge extends past its items. */
  slotAngle: number;
  half: number;
  angle: Record<string, number>;
  presence: Record<string, number>;
  /** Angles of a region's first and last item. */
  span: Record<string, [number, number]>;
  domainPresence: Record<string, number>;
}

/**
 * Lays the view out as angles and radii. Deterministic and DOM-free: the same
 * map, view and label width always produce the same positions.
 *
 * `maxLabelWidth` is the width of the longest item label in map units. It can
 * only be measured against real rendered text, so the caller measures it and
 * passes it in; it widens the rim to make room, and nothing else.
 */
export function computePositions(map: DerivedMap, view: View, maxLabelWidth: number): Positions {
  const visibleNode = (n: DerivedNode) => view === 'full' || n.inFocus;
  const visibleDomain = (d: DerivedDomain) => view === 'full' || d.inFocus;

  /* ---- where each item sits in its stage's waypoint order ---- */
  const wpPos: Record<string, number> = {};
  for (const stage of map.stages) {
    stage.waypoints.forEach((w, i) => (wpPos[w] = i));
  }

  /* ---- slots: one per visible item, clockwise from 12 o'clock ---- */
  // Every region, category and item is walked, visible or not, so hidden ones
  // can be parked in the gap they would occupy. Only visible ones take a slot.
  const domains = [...map.domains].sort((a, b) => a.order - b.order);
  const categoriesOf = (domainId: string) =>
    map.nodes.filter((n) => n.kind === 'category' && n.domain === domainId);
  const childrenOf = (c: DerivedNode) =>
    c.children
      .map((id) => map.byId[id])
      .sort(
        (a, b) =>
          statusRank[a.status] - statusRank[b.status] ||
          (a.stageOrder ?? 9) - (b.stageOrder ?? 9) ||
          (wpPos[a.id] ?? 99) - (wpPos[b.id] ?? 99),
      );

  const slotOf: Record<string, number> = {};
  const presence: Record<string, number> = {};
  const domainSlots: Record<string, [number, number]> = {};
  const domainPresence: Record<string, number> = {};
  let slot = 0;
  let placedDomains = 0;

  for (const domain of domains) {
    const shown = visibleDomain(domain);
    domainPresence[domain.id] = shown ? 1 : 0;
    if (shown && placedDomains++ > 0) slot += GAP_DOMAIN;
    const start = slot;
    let placedCategories = 0;

    for (const category of categoriesOf(domain.id)) {
      const catShown = shown && visibleNode(category);
      presence[category.id] = catShown ? 1 : 0;
      if (catShown && placedCategories++ > 0) slot += GAP_CAT;

      const placed: number[] = [];
      for (const kid of childrenOf(category)) {
        const kidShown = catShown && visibleNode(kid);
        presence[kid.id] = kidShown ? 1 : 0;
        if (kidShown) {
          slotOf[kid.id] = slot;
          placed.push(slot);
          slot += 1;
        } else {
          // Between the item before and the one after.
          slotOf[kid.id] = slot - 0.5;
        }
      }
      slotOf[category.id] = placed.length ? (placed[0] + placed[placed.length - 1]) / 2 : slot - 0.5;
    }

    domainSlots[domain.id] = shown ? [start, slot - 1] : [slot - 0.5, slot - 0.5];
  }

  const total = slot - 1 + GAP_DOMAIN;
  const angleOf = (s: number) => ((s + GAP_DOMAIN / 2) / total) * TAU;

  /* ---- grow the whole map when there are too many leaves for the default ring ---- */
  const grow = Math.max(1, (total * SLOT_PX) / TAU / BASE_R.leaf);
  const R = { ...BASE_R };
  for (const key of Object.keys(R) as (keyof Radii)[]) {
    R[key] = key === 'cat' ? R[key] * (1 + (grow - 1) * 0.6) : R[key] * grow;
  }

  /* ---- make room for the longest item label before drawing the rim ---- */
  const needed = R.leaf + 16 + maxLabelWidth + 24 - R.wedgeOut;
  if (needed > 0) {
    R.wedgeOut += needed;
    R.region += needed;
    R.extent += needed;
  }

  const angle: Record<string, number> = {};
  for (const id in slotOf) angle[id] = angleOf(slotOf[id]);

  const span: Record<string, [number, number]> = {};
  for (const id in domainSlots) span[id] = [angleOf(domainSlots[id][0]), angleOf(domainSlots[id][1])];

  return {
    R,
    slotAngle: TAU / total,
    half: ((0.5 + GAP_CAT / 2) / total) * TAU,
    angle,
    presence,
    span,
    domainPresence,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Positions part way from `a` to `b`. Movement runs over the whole of `t`;
 * fading is squeezed so items leave early and arrive late, which keeps labels
 * from piling up while they slide past each other.
 */
export function blendPositions(a: Positions, b: Positions, t: number): Positions {
  if (t >= 1) return b;
  if (t <= 0) return a;

  const fade = (from: number, to: number) =>
    lerp(from, to, to < from ? Math.min(1, t / 0.6) : Math.max(0, (t - 0.4) / 0.6));

  const R = { ...b.R };
  for (const key of Object.keys(R) as (keyof Radii)[]) R[key] = lerp(a.R[key], b.R[key], t);

  const angle: Record<string, number> = {};
  const presence: Record<string, number> = {};
  for (const id in b.angle) {
    angle[id] = lerp(a.angle[id] ?? b.angle[id], b.angle[id], t);
    presence[id] = fade(a.presence[id] ?? 0, b.presence[id]);
  }

  const span: Record<string, [number, number]> = {};
  const domainPresence: Record<string, number> = {};
  for (const id in b.span) {
    const from = a.span[id] ?? b.span[id];
    span[id] = [lerp(from[0], b.span[id][0], t), lerp(from[1], b.span[id][1], t)];
    domainPresence[id] = fade(a.domainPresence[id] ?? 0, b.domainPresence[id]);
  }

  return {
    R,
    slotAngle: lerp(a.slotAngle, b.slotAngle, t),
    half: lerp(a.half, b.half, t),
    angle,
    presence,
    span,
    domainPresence,
  };
}

/**
 * Derives the whole drawing from a set of positions, so the renderer can be a
 * plain {#each} over the result. Anything with presence 0 is left out.
 */
export function buildLayout(map: DerivedMap, p: Positions): Layout {
  const { R, angle, presence } = p;

  const waypointIndex: Record<string, number> = {};
  for (const stage of map.stages) {
    for (const w of stage.waypoints) waypointIndex[w] = stage.order;
  }

  const bracketR = R.leaf - BRACKET_INSET;
  const track = R.leaf - TRACK_INSET;
  const byId: Record<string, Placement> = {};

  /* ---- items ---- */
  const leaves: LeafPlacement[] = map.nodes
    .filter((n) => n.kind !== 'category' && presence[n.id] > 0)
    .map((node) => {
      const a = angle[node.id];
      const [x, y] = xy(a, R.leaf);
      const placement: LeafPlacement = {
        node,
        a,
        r: R.leaf,
        x,
        y,
        flip: a > Math.PI,
        presence: presence[node.id],
        waypoint: waypointIndex[node.id] ?? null,
      };
      byId[node.id] = placement;
      return placement;
    });

  /* ---- categories: a bracket spanning their items, label reading inwards ---- */
  const categories: CategoryPlacement[] = map.nodes
    .filter((n) => n.kind === 'category' && presence[n.id] > 0)
    .map((node) => {
      const a = angle[node.id];
      // An item that is fading in or out pulls the bracket only as far as it is
      // present; one that is gone sits at the category's own angle.
      const kidAngles = node.children.map((id) => lerp(a, angle[id], presence[id]));
      const a0 = (kidAngles.length ? Math.min(...kidAngles) : a) - p.slotAngle * 0.35;
      const a1 = (kidAngles.length ? Math.max(...kidAngles) : a) + p.slotAngle * 0.35;

      const tick = 7;
      const [sx, sy] = xy(a0, bracketR + tick);
      const [s0x, s0y] = xy(a0, bracketR);
      const [e0x, e0y] = xy(a1, bracketR);
      const [ex, ey] = xy(a1, bracketR + tick);

      const [x, y] = xy(a, bracketR);
      const placement: CategoryPlacement = {
        node,
        a,
        r: bracketR,
        x,
        y,
        flip: a > Math.PI,
        presence: presence[node.id],
        a0,
        a1,
        bracket: `M${sx},${sy} L${s0x},${s0y} A${bracketR},${bracketR} 0 0 1 ${e0x},${e0y} L${ex},${ey}`,
      };
      byId[node.id] = placement;
      return placement;
    });

  /* ---- territories ---- */
  const wedgeArc = arc<{ startAngle: number; endAngle: number }>()
    .innerRadius(R.wedgeIn)
    .outerRadius(R.wedgeOut)
    .cornerRadius(26);

  const domainPlacements: DomainPlacement[] = [...map.domains]
    .filter((d) => p.domainPresence[d.id] > 0)
    .sort((a, b) => a.order - b.order)
    .map((domain) => {
      const [from, to] = p.span[domain.id];
      // A region that is folding away narrows to nothing rather than to its gaps.
      const half = p.half * p.domainPresence[domain.id];
      const a0 = from - half * 2;
      const a1 = to + half * 2;
      return {
        domain,
        presence: p.domainPresence[domain.id],
        wedge: wedgeArc({ startAngle: from - half, endAngle: to + half }) ?? '',
        rimId: `rim-${domain.id}`,
        rim: rimArc(a0, a1, isLowerHalf(a0, a1) ? R.region + 10 : R.region),
        a0,
        a1,
        rimLength: Math.abs(a1 - a0) * R.region,
      };
    });

  /* ---- the route: a transit line on a track just inside the ring ---- */
  const route: RouteSegment[] = [];
  let prevA: number | null = null;
  for (const stage of map.stages) {
    const angles = stage.waypoints.map((w) => angle[w]);
    let d: string;
    if (prevA === null) {
      d = `M0,0 C${pt(angles[0], 90)} ${pt(angles[0], track - 120)} ${pt(angles[0], R.leaf)}`;
    } else {
      d = `M${pt(prevA, R.leaf)}` + hop(prevA, angles[0], track, R.leaf);
    }
    for (let i = 1; i < angles.length; i++) {
      d += hop(angles[i - 1], angles[i], track, R.leaf);
    }
    route.push({ order: stage.order, d });
    prevA = angles[angles.length - 1];
  }

  /* ---- survey graticule ---- */
  const toLine = (deg: number, r0: number, r1: number): Line => {
    const a = (deg * Math.PI) / 180;
    const [x1, y1] = xy(a, r0);
    const [x2, y2] = xy(a, r1);
    return { x1, y1, x2, y2 };
  };

  const grid: Grid = {
    rings: range(120, R.extent - 60, 120),
    spokes: range(0, 360, 30).map((deg) => toLine(deg, 60, R.extent - 40)),
    ticks: range(0, 360, 2).map((deg) =>
      toLine(deg, R.extent - 36, R.extent - 36 + (deg % 10 === 0 ? 9 : 4)),
    ),
    rimOuter: R.extent - 36,
    rimInner: R.extent - 30,
  };

  return {
    R,
    track,
    domains: domainPlacements,
    categories,
    leaves,
    byId,
    route,
    grid,
    band: { inner: R.wedgeOut, outer: grid.rimOuter },
  };
}
