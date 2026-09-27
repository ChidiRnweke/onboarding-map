/**
 * Onboarding map — data model
 * ---------------------------------------------------------------
 * Two layers, kept deliberately separate:
 *
 *  1. The TERRITORY  (domains → categories → technologies/concepts)
 *     Everything a junior might meet in the ecosystem. Stable, reusable,
 *     and not tied to one onboarding run.
 *
 *  2. The JOURNEY    (stages → waypoints)
 *     The highlighted route through the territory. Swap the chosen
 *     coding agent or hosting target by changing `status` on a handful
 *     of nodes and re-pointing stage waypoints; the territory stays put.
 *
 * Nothing in here knows about pixels. Layout is derived by the renderer
 * from `Domain.order` and the parent/child tree, so the same data always
 * produces the same map.
 */

import { withDefaults, type LabelsInput } from './labels.ts';

/**
 * Ids are plain strings so any subject can be mapped without touching
 * this file. `validate()` checks that every reference resolves.
 */
export type DomainId = string;
export type StageId = string;

/**
 * What kind of thing a node is on the map. The dataset names its own kinds
 * (`OnboardingMap.kinds`): a cloud map has technologies and concepts, a
 * physics map laws and phenomena. One is structural and known to the engine:
 * 'category', a grouping inside a domain ("Coding agent", "IaC tool").
 */
export type NodeKind = string;
export const CATEGORY: NodeKind = 'category';

/** A kind of node the dataset uses, with what it means on this map. */
export interface KindDef {
  id: NodeKind;
  label: string;
  plural: string;
  /** One or two sentences on what counts as this kind here. */
  description: string;
}

/**
 * How the node relates to the onboarding route.
 *  - path:        the junior touches this during onboarding
 *  - alternative: a sibling choice we deliberately did NOT pick
 *  - context:     adjacent, worth knowing exists, not required
 */
export type NodeStatus = 'path' | 'alternative' | 'context';

/** Free-form key; its display name comes from `labels.sources`. */
export type DocSource = string;

export interface DocLink {
  title: string;
  /** Use 'TODO' for internal links that still need a real URL. */
  url: string;
  source: DocSource;
}

/** An internal document (deck, wiki page) the map content is based on. */
export interface SourceDocument {
  id: string;
  title: string;
  /** ISO date, e.g. '2025-02-19'. */
  date?: string;
  audience?: string;
  /** Use 'TODO' until the document has a shareable location. */
  url: string;
  /**
   * ISO date the map's content was last checked against this document. When
   * `date` is later, `audit` flags the content that cites it. Without it, the
   * map file's last commit date is used.
   */
  reviewed?: string;
}

/** Points at the part of a source document a piece of content comes from. */
export interface Ref {
  doc: string;
  slides?: number[];
}

export interface Domain {
  id: DomainId;
  label: string;
  /** One line describing the region of the map. */
  tagline: string;
  /** A paragraph about the region, for its own view. */
  summary?: string;
  /** Set on the rim instead of the label when even two lines of it do not fit. */
  shortLabel?: string;
  /** Position around the map, clockwise from 12 o'clock. 0-based. */
  order: number;
  /** Base hue for the region. The renderer derives light/dark variants. */
  color: string;
  /** 'full' hides the whole slice in the focused view. It may not contain route items. */
  detail?: Detail;
}

/**
 * Which view an item appears in. Route items are always in focus. Everything
 * else only appears in the focused view when marked 'focus' (or when a stage
 * lists it under Read). 'full' forces an item or slice out of the focused view.
 */
export type Detail = 'focus' | 'full';

export interface MapNode {
  id: string;
  label: string;
  domain: DomainId;
  kind: NodeKind;
  status: NodeStatus;
  /** Category this node sits under. Categories themselves have no parent. */
  parent?: string;
  /** Plain-language explanation shown in the side panel. */
  summary: string;
  /** Required for `path` nodes: the stage in which the junior first uses it. */
  stage?: StageId;
  /** For `alternative` nodes: the path node it could replace. */
  alternativeTo?: string;
  docs?: DocLink[];
  /** Where in our own documents this comes from. */
  refs?: Ref[];
  /**
   * The same idea in different settings, e.g. how a coding standard looks
   * in Python and in TypeScript. Shown as separate blocks in the panel.
   */
  variants?: { label: string; summary: string; docs?: DocLink[] }[];
  /** See Detail. Leave empty to use the defaults. */
  detail?: Detail;
  /**
   * Force when the node appears on the map. Useful for categories whose
   * children are all context, so a region isn't hidden until the last stage.
   */
  reveal?: StageId;
  tags?: string[];
}

/** Free-form verb, e.g. 'provisions' or 'derives-from'. Shown with dashes as spaces unless `label` is set. */
export type EdgeKind = string;

/** Cross-links that are not part of the category tree. */
export interface MapEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  /** Optional human phrasing; defaults to the kind. */
  label?: string;
}

/**
 * One line under Do or Observe. A plain string, or an object when the step
 * comes with a tip: extra help shown under it, such as a hint, a worked
 * example or a command to try. What a tip is called comes from `labels.tip`.
 */
export type Step = string | StepDetail;

export interface StepDetail {
  text: string;
  tip?: string;
  /**
   * How the tip is offered. 'copy' (the default) shows it with a copy button:
   * a prompt, a command, a phrase to use. 'reveal' hides it until asked for:
   * a hint or an answer the learner should try without first.
   */
  tipKind?: 'copy' | 'reveal';
  /** Give the learner a place to write down what they saw. Kept in their browser. */
  note?: boolean;
  /** Map nodes the step is about. The map zooms to them while the step is open; without them, to the stage's waypoints. */
  nodes?: string[];
}

/** A group of stages (a day, a week…), named for the journey strip and its overview. */
export interface Period {
  period: number;
  title: string;
  /** One line on what the period achieves. */
  summary?: string;
}

export interface Stage {
  id: StageId;
  /** Which group the stage belongs to (day, week, module…). Named by `labels.period`. */
  period: number;
  /** 1-based position in the journey. */
  order: number;
  title: string;
  /** The first-person sentence the junior should be able to say afterwards. */
  feeling: string;
  /** What the junior does in this stage, in one or two sentences. */
  task: string;
  /** Goal modules this stage completes. Each module is delivered by exactly one stage. */
  delivers?: string[];
  /** Goal modules this stage works on without completing them yet. */
  contributes?: string[];
  /** Ordered nodes the drawn route passes through (keep it to 3–5). */
  waypoints: string[];
  /** Do → Observe → Read. `read` references node ids whose docs to surface. */
  do: Step[];
  observe: Step[];
  read: string[];
  /** How the junior knows they are done. */
  checkpoint: string;
  /**
   * One or two sentences tying the stage to the big picture: what exists so
   * far, what this stage adds and what that makes possible. Without it the
   * bridge is put together from the goal modules.
   */
  bridge?: string;
  refs?: Ref[];
}

/**
 * The goal: the finished thing the journey builds, broken into modules.
 * Stages deliver modules; modules explain why a stage matters.
 */
export interface Goal {
  title: string;
  /** What exists at the end, in plain words. */
  statement: string;
  /** How you know the whole goal is reached. */
  doneWhen: string;
  /**
   * The big picture in a few sentences: how the parts work together, told
   * before any of them is built. It is the frame every stage is hung on.
   */
  story?: string;
  modules: GoalModule[];
}

export interface GoalModule {
  id: string;
  title: string;
  /** Why the goal needs this part. */
  purpose: string;
  /** Other module ids that must exist first. */
  dependsOn: string[];
  /**
   * How this module relates to the ones it depends on, as a verb read from
   * this module to the other: Agent "runs in" Cloud environment. Drawn on the
   * link in the big picture; links without one read as `labels.bigPicture.buildsOn`.
   */
  relations?: { to: string; verb: string }[];
  /** Map nodes this module is made of. */
  builtFrom: string[];
  /** Tangible things that exist once the module is done. */
  produces: string[];
  /** A goal can still be reached without optional modules. */
  optional?: boolean;
  refs?: Ref[];
}

/** Model providers the assistant can call from the learner's browser. */
export type AssistantProvider =
  | 'openai' | 'anthropic' | 'google' | 'openrouter' | 'azure' | 'ollama' | 'lmstudio' | 'custom';

export const ASSISTANT_PROVIDERS: AssistantProvider[] =
  ['openai', 'anthropic', 'google', 'openrouter', 'azure', 'ollama', 'lmstudio', 'custom'];

/**
 * An agent that helps the learner along the route: it explains a step, a
 * concept or a link where the learner is looking, and moves the map to show
 * what it means. Every map has one unless it says `enabled: false`. The
 * learner brings their own key, which never leaves their browser except to the
 * provider; nothing here is secret.
 */
export interface Assistant {
  /** `false` turns the assistant off for this map. Default: on. */
  enabled?: boolean;
  /** The provider offered first. The learner can pick another unless `keyless`. */
  provider?: AssistantProvider;
  /** Model id; for Azure, the deployment name. Default: the provider's own. */
  model?: string;
  /** Azure resource URL, a local server, or an organisation's OpenAI-compatible proxy. */
  baseURL?: string;
  /** Said to the model before anything else: house rules, tone, what not to do. */
  instructions?: string;
  /** The proxy at `baseURL` holds the key, so the learner is never asked for one. */
  keyless?: boolean;
}

/**
 * Every piece of interface copy. Placeholders in {braces} are filled in
 * by the renderer; the ones available are listed per field.
 */
export interface Labels {
  /** Browser tab title. */
  pageTitle: string;
  /** Paragraph under the main title. */
  intro: string;
  /** Text next to the centre of the map. */
  start: string;
  /** Name for a group of stages: "Day", "Week", "Module". */
  period: string;
  /** The switch between the focused and the full map. */
  view: { focus: string; full: string; label: string };
  /** Top of the stage panel. {period} {periodNumber} {stage} {total} */
  stagePosition: string;
  legend: {
    path: string;
    alternative: string;
    context: string;
    route: string;
    showAll: string;
    /** Heading of the legend card, and its name when minimised. */
    heading: string;
    /** Buttons that minimise and restore the legend card. */
    hide: string;
    show: string;
  };
  method: {
    do: { lead: string; title: string };
    observe: { lead: string; title: string };
    read: { lead: string; title: string };
  };
  /**
   * Box under a step that has a tip. `label` names a copy tip and `copy` and
   * `copied` its button; `hint` names a reveal tip and `reveal` ({label}) the
   * button that shows it.
   */
  tip: { label: string; copy: string; copied: string; hint: string; reveal: string };
  checkpoint: string;
  pager: { previous: string; next: string; complete: string };
  node: {
    /** Tag shown on nodes tagged 'proposed'. */
    proposed: string;
    /** {stage} */
    back: string;
    /** {stage} is replaced by e.g. "stage 3, Agent" in bold. */
    onRoute: string;
    /** {stageNumber} {stageTitle} */
    onRouteStage: string;
    /** {node} is replaced by a link to the node. */
    alternativeTo: string;
    context: string;
    connections: string;
    /** Suffix for incoming relations: "Terraform provisions this". */
    incomingSuffix: string;
    alternatives: string;
    pendingLink: string;
    /** Disclosure holding every documentation link after the first. */
    moreDocs: string;
    /** Top of a concept opened from Read. {n} is the stage number, {stage} its title. */
    backToRead: string;
    /** Progress through the stage's reading. {n} {total} */
    readProgress: string;
    /** Button to the next concept to read. {node} */
    nextRead: string;
    /** The kind chip on a category, which is a grouping rather than a kind. */
    group: string;
    /** Section on a category: the items in it. */
    inGroup: string;
  };
  refs: {
    heading: string;
    /** Shown instead of a link when the document has no URL yet. */
    noLink: string;
    slide: string;
    slides: string;
  };
  goal: {
    heading: string;
    doneWhen: string;
    produces: string;
    builtFrom: string;
    /** Line in the node view. {module} is a link to the module. */
    partOf: string;
    /** Eyebrow of the module view. {n} {total}, and {goal} for the goal's title. */
    partNumber: string;
    /** An incoming relation, read from the other part: "Chat app calls it". {verb} */
    itsVerb: string;
    optional: string;
    /** Back link from the module view. {stage} */
    back: string;
    /** Spoken value of the goal progress bar. {done} {total} */
    progress: string;
  };
  /** The goal told as one picture: the intro, the stage bridge and the look back. */
  bigPicture: {
    /** Button that opens the intro again. */
    open: string;
    /** Heading of the intro's first card. */
    heading: string;
    /** Intro card for one part. {n} {total} */
    part: string;
    /** Under a part in the intro. {stage} */
    builtIn: string;
    next: string;
    back: string;
    skip: string;
    /** Last button of the intro. {stage} */
    start: string;
    /** Default verb on a link without a relation. */
    buildsOn: string;
    /** Stage bridge when the stage has none: {done} lists what exists, {module} what is added. */
    bridgeFirst: string;
    bridge: string;
    /** Stage bridge for a stage that adds no module. */
    bridgeNone: string;
    /** The look back after the checkpoint. */
    lookBack: string;
    /** {module} */
    nowBuilt: string;
    /** Lead-in before the next part. */
    nextUp: string;
    /** Heading over the notes the learner wrote during the stage. */
    yourNotes: string;
    /** Label on the small picture that is always in view. */
    youAreHere: string;
  };
  /** What a period (a day, a week…) gives you, opened from the journey strip. */
  periodOverview: {
    /** Button on the period label. {period} {n} */
    open: string;
    /** Eyebrow of the overview. {period} {n} {total} */
    position: string;
    /** Lead-in before what a stage delivers. */
    gives: string;
    /** Over the big picture as it stands at the end of the period. {period} {n} */
    endOf: string;
    /** Button that starts the period's first stage. {period} {n} */
    start: string;
  };
  /** The phases of a stage, in the order they are shown. */
  phases: {
    brief: string;
    do: string;
    observe: string;
    read: string;
    done: string;
    /** Buttons that move through a phase's items. */
    next: string;
    previous: string;
    /** Button that moves on to the following phase. {phase} */
    continueTo: string;
    /** Placeholder of a note field. */
    notePlaceholder: string;
    /** Marks a read item as read. */
    markRead: string;
    /** Closes the stage and moves on. */
    complete: string;
  };
  /** Names for landmarks and controls that only screen readers hear. */
  aria: {
    stages: string;
    map: string;
    /** Description of the map picture itself. */
    mapImage: string;
    zoomIn: string;
    zoomOut: string;
    fit: string;
    togglePanel: string;
  };
  /** The region view, opened from a region's name. */
  region: {
    /** Eyebrow of the region view. */
    context: string;
    /** Chip: how much of the region the route visits. {n} */
    onRoute: string;
    /** Section: the route's items in this region, by stage. */
    route: string;
    /** Section: goal parts made from this region. */
    parts: string;
    /** Section: the region's groups and their items. */
    contents: string;
    /** Button that shows a group's items outside the focused view. {n} */
    more: string;
  };
  /** The kind view, opened from a node's kind. */
  kind: {
    context: string;
    /** Chip. {n} on the route, {total} in all */
    count: string;
    onRoute: string;
    elsewhere: string;
  };
  /** Display names for DocLink.source keys. Unknown keys show as-is. */
  sources: Record<string, string>;
  /** The assistant: its actions where they apply, its answers, its setup. */
  agent: {
    /** Actions, each placed on the thing it acts on. Short: they sit beside other controls. */
    walkThrough: string;
    explainNode: string;
    explainLink: string;
    takeaways: string;
    checkMe: string;
    fit: string;
    summarize: string;
    /** Under a step's note field, once the learner has written something. */
    checkNote: string;
    ask: string;
    /** The Agent view's opening sentence. {place} */
    context: string;
    followUp: string;
    /** Under every answer, so it is never mistaken for the map's own text. {model} */
    provenance: string;
    earlier: string;
    back: string;
    stop: string;
    retry: string;
    accept: string;
    decline: string;
    setup: string;
    setupIntro: string;
    test: string;
    settings: string;
    forget: string;
  };
}

export interface OnboardingMap {
  /** JSON Schema reference, for editors. Ignored by the renderer. */
  $schema?: string;
  /**
   * Stable name for the map, used to keep a learner's progress apart from
   * other maps in the same browser. Defaults to the title.
   */
  id?: string;
  version: string;
  title: string;
  motto: string;
  /** Interface copy. Anything left out uses the defaults in labels.ts. */
  labels?: LabelsInput;
  /** Optional: a map without a goal still works as a plain journey. */
  goal?: Goal;
  /** The agent that helps along the route. On unless `enabled: false`. */
  assistant?: Assistant;
  /** The kinds of node this map uses. Every node's kind is one of these, or 'category'. */
  kinds: KindDef[];
  /** Names for the periods stages are grouped in. Periods without one are just numbered. */
  periods?: Period[];
  /** Internal documents that `refs` point at. */
  documents?: SourceDocument[];
  domains: Domain[];
  nodes: MapNode[];
  edges: MapEdge[];
  stages: Stage[];
}

/* ------------------------------------------------------------------ */
/* Derivation                                                          */
/* ------------------------------------------------------------------ */

export interface DerivedDomain extends Domain {
  inFocus: boolean;
}

export interface DerivedNode extends MapNode {
  /** Shown in the focused view. */
  inFocus: boolean;
  /** 1-based stage order at which this node becomes visible on the map. */
  revealAt: number;
  /** For path nodes, the 1-based stage order they belong to. */
  stageOrder?: number;
  children: string[];
}

export interface DerivedModule extends GoalModule {
  /** Stage that delivers it. */
  stage?: StageId;
  stageOrder?: number;
  /** First stage that works on it (a contributing stage, or the delivering one). */
  startOrder?: number;
  /** 0 for modules without dependencies, then one more than the deepest dependency. */
  depth: number;
  neededBy: string[];
}

export interface DerivedMap extends OnboardingMap {
  /** Complete: the map's own copy over the defaults. */
  labels: Labels;
  domains: DerivedDomain[];
  nodes: DerivedNode[];
  byId: Record<string, DerivedNode>;
  modules: DerivedModule[];
  moduleById: Record<string, DerivedModule>;
  /** node id → ids of the modules it belongs to */
  nodeModules: Record<string, string[]>;
}

/**
 * Resolve when each node is revealed, without having to hand-author it:
 *  - path nodes: their own stage
 *  - alternatives: the stage of the node they are an alternative to
 *  - categories: the earliest stage of any child
 *  - context nodes: the stage of their parent category
 */
export function derive(map: OnboardingMap): DerivedMap {
  const stageOrder = new Map(map.stages.map((s) => [s.id, s.order] as const));
  const last = Math.max(...map.stages.map((s) => s.order));

  const byId: Record<string, DerivedNode> = {};
  for (const n of map.nodes) {
    byId[n.id] = {
      ...n,
      revealAt: last,
      inFocus: false,
      stageOrder: n.stage ? stageOrder.get(n.stage) : undefined,
      children: [],
    };
  }
  for (const n of Object.values(byId)) {
    if (n.parent && byId[n.parent]) byId[n.parent].children.push(n.id);
  }

  // 1. path nodes
  for (const n of Object.values(byId)) {
    if (n.status === 'path' && n.stageOrder) n.revealAt = n.stageOrder;
  }
  // 2. alternatives follow what they replace
  for (const n of Object.values(byId)) {
    if (n.alternativeTo && byId[n.alternativeTo]?.stageOrder) {
      n.revealAt = byId[n.alternativeTo].stageOrder!;
    }
  }
  // 3. categories reveal with their earliest child
  for (const n of Object.values(byId)) {
    if (n.kind !== 'category') continue;
    const childStages = n.children
      .map((c) => byId[c])
      .filter((c) => c.status === 'path' || c.alternativeTo)
      .map((c) => c.revealAt);
    if (childStages.length) n.revealAt = Math.min(...childStages);
  }
  // 4. remaining context/alternative nodes inherit their category
  for (const n of Object.values(byId)) {
    if (n.kind === 'category' || n.status === 'path' || n.alternativeTo) continue;
    if (n.parent && byId[n.parent]) n.revealAt = byId[n.parent].revealAt;
  }

  // 5. explicit overrides win, and flow down to children that have no stage of their own
  for (const n of Object.values(byId)) {
    if (n.reveal && stageOrder.has(n.reveal)) n.revealAt = stageOrder.get(n.reveal)!;
  }
  for (const n of Object.values(byId)) {
    if (n.kind === 'category' || n.status === 'path' || n.alternativeTo || n.reveal) continue;
    if (n.parent && byId[n.parent]?.reveal) n.revealAt = byId[n.parent].revealAt;
  }

  // Focused view: route items, items marked 'focus', and anything a stage asks you to read.
  const readIds = new Set(map.stages.flatMap((s) => s.read));
  const domainHidden = new Set(map.domains.filter((d) => d.detail === 'full').map((d) => d.id));
  for (const n of Object.values(byId)) {
    if (n.kind === 'category' || domainHidden.has(n.domain) || n.detail === 'full') continue;
    n.inFocus = n.status === 'path' || n.detail === 'focus' || readIds.has(n.id);
  }
  for (const n of Object.values(byId)) {
    if (n.kind !== 'category') continue;
    n.inFocus = n.detail !== 'full' && n.children.some((c) => byId[c].inFocus);
  }
  for (const n of Object.values(byId)) {
    if (n.kind !== 'category' && n.parent && !byId[n.parent].inFocus) n.inFocus = false;
  }
  const domains: DerivedDomain[] = map.domains.map((d) => ({
    ...d,
    inFocus: !domainHidden.has(d.id) && Object.values(byId).some((n) => n.domain === d.id && n.inFocus),
  }));

  // Goal modules: who delivers them, how deep they sit, who needs them.
  const moduleById: Record<string, DerivedModule> = {};
  for (const m of map.goal?.modules ?? []) moduleById[m.id] = { ...m, depth: 0, neededBy: [] };
  for (const s of map.stages)
    for (const id of s.delivers ?? [])
      if (moduleById[id]) Object.assign(moduleById[id], { stage: s.id, stageOrder: s.order });
  for (const m of Object.values(moduleById)) m.startOrder = m.stageOrder;
  for (const s of map.stages)
    for (const id of s.contributes ?? [])
      if (moduleById[id]) moduleById[id].startOrder = Math.min(moduleById[id].startOrder ?? s.order, s.order);
  for (const m of Object.values(moduleById))
    for (const dep of m.dependsOn) moduleById[dep]?.neededBy.push(m.id);
  const depthOf = (id: string, seen: string[] = []): number => {
    const m = moduleById[id];
    if (!m || seen.includes(id)) return 0;
    return m.dependsOn.length ? 1 + Math.max(...m.dependsOn.map((d) => depthOf(d, [...seen, id]))) : 0;
  };
  for (const m of Object.values(moduleById)) m.depth = depthOf(m.id);
  const nodeModules: Record<string, string[]> = {};
  for (const m of Object.values(moduleById))
    for (const n of m.builtFrom) (nodeModules[n] ??= []).push(m.id);

  return {
    ...map,
    labels: withDefaults(map.labels),
    domains,
    nodes: Object.values(byId),
    byId,
    modules: Object.values(moduleById),
    moduleById,
    nodeModules,
  };
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/**
 * The map is laid out clockwise: slices by `order`, categories in data order,
 * and inside a category path nodes first (by stage, then waypoint position).
 * The route should only move forward around that ring; a step backwards forces
 * a jump across the map. Returns one message per backwards step.
 */
export function routeBacksteps(map: OnboardingMap, maxSkip = 16): string[] {
  const stageOrder = new Map(map.stages.map((s) => [s.id, s.order] as const));
  const wpPos = new Map<string, number>();
  for (const s of map.stages) s.waypoints.forEach((w, i) => wpPos.set(w, i));
  const rank = { path: 0, alternative: 1, context: 2 } as const;
  const position = new Map<string, number>();
  let i = 0;
  for (const d of [...map.domains].sort((a, b) => a.order - b.order))
    for (const c of map.nodes.filter((n) => n.kind === 'category' && n.domain === d.id))
      map.nodes
        .filter((n) => n.parent === c.id)
        .sort((a, b) => rank[a.status] - rank[b.status]
          || (stageOrder.get(a.stage ?? '') ?? 99) - (stageOrder.get(b.stage ?? '') ?? 99)
          || (wpPos.get(a.id) ?? 99) - (wpPos.get(b.id) ?? 99))
        .forEach((n) => position.set(n.id, i++));
  const route = [...map.stages].sort((a, b) => a.order - b.order).flatMap((s) => s.waypoints.map((w) => ({ w, s: s.id })));
  const issues: string[] = [];
  for (let k = 1; k < route.length; k++) {
    const prev = route[k - 1], cur = route[k];
    const from = position.get(prev.w) ?? 0, to = position.get(cur.w) ?? 0;
    if (to < from) issues.push(`route steps back from ${prev.w} (${prev.s}) to ${cur.w} (${cur.s})`);
    else if (to - from > maxSkip)
      issues.push(`route skips ${to - from} items between ${prev.w} (${prev.s}) and ${cur.w} (${cur.s}); move the slice in between`);
  }
  return issues;
}

/** Path nodes that no goal module claims. Not an error, but a hint that a step has no stated purpose. */
export function unclaimedPathNodes(map: OnboardingMap): string[] {
  if (!map.goal) return [];
  const claimed = new Set(map.goal.modules.flatMap((m) => m.builtFrom));
  return map.nodes.filter((n) => n.status === 'path' && n.kind !== 'category' && !claimed.has(n.id)).map((n) => n.id);
}

/**
 * One problem with the data. `path` locates it, e.g. `nodes.terraform`,
 * `stages.s3` or `goal.modules.chat-app`, so a person or an agent can find
 * the object to fix; `message` says what is wrong.
 */
export interface ValidationIssue {
  path: string;
  message: string;
}

export const formatIssue = (i: ValidationIssue) => `${i.path}: ${i.message}`;

export function validate(map: OnboardingMap): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const err = (path: string, message: string) => errors.push({ path, message });
  const ids = new Set<string>();
  const domainIds = new Set(map.domains.map((d) => d.id));
  const stageIds = new Set(map.stages.map((s) => s.id));
  const byId = new Map(map.nodes.map((n) => [n.id, n] as const));
  const kindIds = new Set(map.kinds.map((k) => k.id));
  if (kindIds.size !== map.kinds.length) err('kinds', 'duplicate ids');
  if (kindIds.has(CATEGORY)) err('kinds', `'${CATEGORY}' is structural and cannot be redefined`);

  for (const n of map.nodes) {
    const at = `nodes.${n.id}`;
    if (ids.has(n.id)) err(at, 'duplicate node id');
    ids.add(n.id);
    if (!domainIds.has(n.domain)) err(at, `unknown domain ${n.domain}`);
    if (n.kind !== CATEGORY && !kindIds.has(n.kind)) err(at, `unknown kind ${n.kind}`);
    if (n.kind === 'category' && n.parent) err(at, 'categories cannot have a parent');
    if (n.kind !== 'category' && !n.parent) err(at, 'needs a parent category');
    if (n.parent) {
      const p = byId.get(n.parent);
      if (!p) err(at, `unknown parent ${n.parent}`);
      else if (p.kind !== 'category') err(at, `parent ${n.parent} is not a category`);
      else if (p.domain !== n.domain) err(at, 'parent is in another domain');
    }
    if (n.status === 'path' && n.kind !== 'category' && !n.stage) err(at, 'path nodes need a stage');
    if (n.stage && !stageIds.has(n.stage)) err(at, `unknown stage ${n.stage}`);
    if (n.alternativeTo) {
      const t = byId.get(n.alternativeTo);
      if (!t) err(at, `alternativeTo unknown ${n.alternativeTo}`);
      else if (t.status !== 'path') err(at, 'alternativeTo should point at a path node');
    }
    if (n.status === 'alternative' && !n.alternativeTo) err(at, 'alternatives should name what they replace');
  }
  map.edges.forEach((e, i) => {
    if (!byId.has(e.from)) err(`edges[${i}]`, `unknown from ${e.from}`);
    if (!byId.has(e.to)) err(`edges[${i}]`, `unknown to ${e.to}`);
  });
  const orders = map.stages.map((s) => s.order).sort((a, b) => a - b);
  orders.forEach((o, i) => o !== i + 1 && err('stages', 'order should be 1..n'));
  for (const s of map.stages) {
    const at = `stages.${s.id}`;
    for (const w of s.waypoints) {
      const n = byId.get(w);
      if (!n) err(at, `unknown waypoint ${w}`);
      else if (n.stage !== s.id) err(at, `waypoint ${w} belongs to stage ${n.stage}`);
    }
    for (const r of s.read) if (!byId.has(r)) err(at, `unknown read ref ${r}`);
    for (const step of [...s.do, ...s.observe])
      if (typeof step !== 'string') {
        for (const n of step.nodes ?? []) if (!byId.has(n)) err(at, `step points at unknown node ${n}`);
        if (step.tipKind && !step.tip) err(at, 'step has a tipKind but no tip');
      }
  }

  const periodNumbers = new Set(map.stages.map((s) => s.period));
  for (const p of map.periods ?? [])
    if (!periodNumbers.has(p.period)) err(`periods.${p.period}`, 'no stage belongs to it');

  // Focused view: route items can't be hidden
  const hiddenDomains = new Set(map.domains.filter((d) => d.detail === 'full').map((d) => d.id));
  for (const n of map.nodes) {
    if (n.status === 'path' && n.kind !== 'category' && (n.detail === 'full' || hiddenDomains.has(n.domain)))
      err(`nodes.${n.id}`, "route items must stay in the focused view (item or its slice is marked 'full')");
  }

  // Source documents
  const docIds = new Set((map.documents ?? []).map((d) => d.id));
  const checkRefs = (at: string, refs?: Ref[]) => {
    for (const r of refs ?? []) if (!docIds.has(r.doc)) err(at, `unknown document ${r.doc}`);
  };
  for (const n of map.nodes) {
    checkRefs(`nodes.${n.id}`, n.refs);
    if (n.reveal && !stageIds.has(n.reveal)) err(`nodes.${n.id}`, `unknown reveal stage ${n.reveal}`);
  }
  for (const s of map.stages) checkRefs(`stages.${s.id}`, s.refs);
  for (const m of map.goal?.modules ?? []) checkRefs(`goal.modules.${m.id}`, m.refs);

  // Assistant
  const a = map.assistant;
  if (a) {
    if (a.provider && !ASSISTANT_PROVIDERS.includes(a.provider))
      err('assistant.provider', `unknown provider ${a.provider}; one of ${ASSISTANT_PROVIDERS.join(', ')}`);
    if (a.baseURL !== undefined && !URL.canParse(a.baseURL)) err('assistant.baseURL', 'not a URL');
    if ((a.provider === 'azure' || a.provider === 'custom' || a.keyless) && !a.baseURL)
      err('assistant.baseURL', a.keyless ? 'keyless needs the proxy URL' : `${a.provider} needs a baseURL`);
    if (a.provider === 'azure' && !a.model) err('assistant.model', 'azure needs the deployment name');
    for (const k of ['enabled', 'keyless'] as const)
      if (a[k] !== undefined && typeof a[k] !== 'boolean') err(`assistant.${k}`, 'should be true or false');
  }

  // Goal checks
  if (map.goal) {
    const mods = new Map(map.goal.modules.map((m) => [m.id, m] as const));
    if (mods.size !== map.goal.modules.length) err('goal.modules', 'duplicate module ids');
    const deliveredBy = new Map<string, Stage>();
    for (const s of map.stages)
      for (const id of s.delivers ?? []) {
        if (!mods.has(id)) err(`stages.${s.id}`, `delivers unknown module ${id}`);
        else if (deliveredBy.has(id))
          err(`goal.modules.${id}`, `delivered by both ${deliveredBy.get(id)!.id} and ${s.id}`);
        else deliveredBy.set(id, s);
      }
    for (const s of map.stages)
      for (const id of s.contributes ?? []) {
        if (!mods.has(id)) err(`stages.${s.id}`, `contributes to unknown module ${id}`);
        else if ((deliveredBy.get(id)?.order ?? 0) < s.order)
          err(`stages.${s.id}`, `contributes to ${id} after the stage that delivers it`);
      }
    for (const m of map.goal.modules) {
      const at = `goal.modules.${m.id}`;
      if (!deliveredBy.has(m.id)) err(at, 'no stage delivers it');
      for (const n of m.builtFrom) if (!byId.has(n)) err(at, `unknown node ${n}`);
      for (const r of m.relations ?? [])
        if (!m.dependsOn.includes(r.to)) err(at, `relation to ${r.to}, which it does not depend on`);
      for (const d of m.dependsOn) {
        if (!mods.has(d)) { err(at, `depends on unknown module ${d}`); continue; }
        const mine = deliveredBy.get(m.id)?.order, theirs = deliveredBy.get(d)?.order;
        if (mine && theirs && theirs > mine)
          err(at, `(stage ${mine}) depends on ${d}, which only arrives in stage ${theirs}`);
        if (!m.optional && mods.get(d)?.optional)
          err(at, `a required module cannot depend on optional module ${d}`);
      }
    }
    // cycles
    const visit = (id: string, path: string[]) => {
      if (path.includes(id)) { err('goal.modules', `dependency cycle ${[...path, id].join(' → ')}`); return; }
      for (const d of mods.get(id)?.dependsOn ?? []) visit(d, [...path, id]);
    };
    for (const m of map.goal.modules) visit(m.id, []);
  } else if (map.stages.some((s) => s.delivers?.length)) {
    err('goal', 'stages deliver modules but there is no goal');
  }
  return errors;
}
