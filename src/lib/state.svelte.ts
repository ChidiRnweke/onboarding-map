import { getContext, setContext } from 'svelte';
import type { View } from './map/layout';
import type { DerivedMap, DerivedModule, DerivedNode, Stage, Step, StepDetail } from '$core/model';
import { emptyProgress, load, mapKey, PHASES, save, type Phase, type StageProgress } from './progress';

/** The slice of a shadcn sidebar's state the rest of the app needs. */
export interface SidebarHandle {
  readonly open: boolean;
  readonly openMobile: boolean;
  readonly isMobile: boolean;
  setOpen(open: boolean): void;
  setOpenMobile(open: boolean): void;
  toggle(): void;
}

export type ModuleState = 'done' | 'current' | 'ahead';

/**
 * All interface state for one view of the map.
 *
 * Deliberately an instance handed through context rather than module-level
 * state: under adapter-node a module is shared across requests, so module-level
 * $state would leak one visitor's selection into another's render.
 */
export class AppState {
  readonly map: DerivedMap;

  stage = $state(1);
  view = $state<View>('focus');
  showAll = $state(false);
  selected = $state<string | null>(null);
  module = $state<string | null>(null);
  hovered = $state<string | null>(null);
  /** Period (day, week…) whose overview is open in the panel. */
  period = $state<number | null>(null);
  /** Region of the map whose overview is open in the panel. */
  region = $state<string | null>(null);
  /** Kind of node whose overview is open in the panel. */
  kind = $state<string | null>(null);
  /** Module hovered in the panel or the big picture; temporarily overrides the selection. */
  hoveredModule = $state<string | null>(null);

  /** The big picture told part by part, over everything else. */
  introOpen = $state(false);

  /** Where the learner is inside the current stage. */
  phase = $state<Phase>('brief');
  step = $state(0);
  /** Per stage, keyed by stage id; restored from and saved to the browser. */
  progress = $state<Record<string, StageProgress>>({});

  /** The retractable panel, registered by the layout once it exists. */
  panel = $state<SidebarHandle | null>(null);

  constructor(map: DerivedMap) {
    this.map = map;
  }

  readonly stageCount = $derived.by(() => this.map.stages.length);
  readonly currentStage = $derived.by(() => this.map.stages.find((s) => s.order === this.stage)!);
  readonly currentModule = $derived.by(() => (this.module ? this.map.moduleById[this.module] : null));
  readonly selectedNode = $derived.by(() => (this.selected ? this.map.byId[this.selected] : null));

  /** What the details panel shows. */
  readonly panelView = $derived.by(() =>
    this.module
      ? 'module'
      : this.selected
        ? 'node'
        : this.period !== null
          ? 'period'
          : this.region
            ? 'region'
            : this.kind
              ? 'kind'
              : 'stage',
  );

  /**
   * What the map should show, following what the learner is looking at: a
   * selected concept with its neighbours, a goal part's nodes, a day's route,
   * the step in hand, the stage's reading. `null` is the whole map: the
   * brief, the look back and the big picture intro zoom all the way out.
   */
  readonly cameraFocus = $derived.by((): string[] | null => {
    if (this.introOpen) return null;
    if (this.selected) {
      const near = this.map.edges.flatMap((e) =>
        e.from === this.selected ? [e.to] : e.to === this.selected ? [e.from] : [],
      );
      return [this.selected, ...near];
    }
    if (this.module) return this.map.moduleById[this.module].builtFrom;
    if (this.period !== null) return this.stagesOf(this.period).flatMap((s) => s.waypoints);
    if (this.region)
      return this.map.nodes
        .filter((n) => n.domain === this.region && n.kind !== 'category' && this.visible(n))
        .map((n) => n.id);
    // A kind is spread over the whole map: show all of it, its nodes outlined.
    if (this.kind) return null;
    const stage = this.currentStage;
    if (this.phase === 'do' || this.phase === 'observe') {
      const step = this.steps(stage, this.phase)[this.step];
      return step?.nodes?.length ? step.nodes : stage.waypoints;
    }
    if (this.phase === 'read') return stage.read;
    return null;
  });

  /**
   * A concept opened from the stage's Read list is read as a tour: where it
   * sits in the list and what comes next. `null` for a concept opened any
   * other way.
   */
  readonly readingTour = $derived.by(() => {
    if (!this.selected || this.phase !== 'read') return null;
    const list = this.currentStage.read;
    const index = list.indexOf(this.selected);
    if (index < 0) return null;
    return { list, index, next: list[index + 1] ?? null, previous: list[index - 1] ?? null };
  });

  /** Ticks off the concept being read and opens the next, or moves on once the list is done. */
  nextRead(): void {
    const tour = this.readingTour;
    if (!tour) return;
    this.markRead(this.selected!);
    if (tour.next) {
      this.markRead(tour.next);
      this.select(tour.next);
    } else {
      const next = this.phases[this.phases.indexOf('read') + 1];
      this.select(null);
      if (next) this.setPhase(next);
    }
  }

  /** Stages of a period, in order. */
  stagesOf(period: number): Stage[] {
    return this.map.stages.filter((s) => s.period === period).sort((a, b) => a.order - b.order);
  }

  /** The goal module a stage builds: the one it delivers, else the one it works toward. */
  moduleOf(stage: Stage): DerivedModule | null {
    const id = stage.delivers?.[0] ?? stage.contributes?.[0];
    return id ? this.map.moduleById[id] : null;
  }

  /** Nodes to outline on the map: the hovered module wins over the selected one. */
  readonly highlightedNodes = $derived.by(() => {
    const id = this.hoveredModule ?? this.module;
    // A kind outlines its nodes on the route, so its spread shows on the map.
    const ids = id
      ? this.map.moduleById[id].builtFrom
      : this.kind
        ? this.map.nodes.filter((n) => n.kind === this.kind && n.status === 'path').map((n) => n.id)
        : [];
    // Rebuilt by the derived whenever its inputs change; never mutated after.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    return new Set(ids);
  });

  /** Goal modules in the order the journey finishes them. */
  readonly modulesInOrder = $derived.by(() =>
    [...this.map.modules].sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0)),
  );

  /** How many goal modules the stages before this one have delivered. */
  readonly modulesDone = $derived.by(
    () => this.map.modules.filter((m) => this.moduleState(m) === 'done').length,
  );

  /** Where a goal module stands at the current stage. */
  moduleState(m: DerivedModule): ModuleState {
    return this.moduleStateAt(m, this.stage);
  }

  /** Where a goal module stands at any stage; the big picture uses it to show a stage's before and after. */
  moduleStateAt(m: DerivedModule, stage: number): ModuleState {
    if ((m.stageOrder ?? 0) < stage) return 'done';
    if ((m.startOrder ?? m.stageOrder ?? 0) <= stage) return 'current';
    return 'ahead';
  }

  /**
   * How far a module is built, 0 to 1. A module worked on across several
   * stages fills in step by step rather than jumping from empty to full; the
   * half step shows the current stage as under way rather than not started.
   */
  moduleProgress(m: DerivedModule): number {
    const state = this.moduleState(m);
    if (state !== 'current') return state === 'done' ? 1 : 0;
    const start = m.startOrder ?? m.stageOrder ?? this.stage;
    const end = m.stageOrder ?? this.stage;
    return (this.stage - start + 0.5) / (end - start + 1);
  }

  /** Items the current view shows at all. */
  visible(node: DerivedNode): boolean {
    return this.view === 'full' || node.inFocus;
  }

  /** Items the journey has reached — everything else is fogged. */
  known(node: DerivedNode): boolean {
    return this.showAll || node.revealAt <= this.stage;
  }

  goto(order: number): void {
    if (order < 1 || order > this.map.stages.length) return;
    this.#remember();
    this.stage = order;
    this.selected = null;
    this.module = null;
    this.#clearOverviews();
    // Pick the stage up where the learner left it.
    const saved = this.progress[this.currentStage.id];
    this.phase = saved?.phase ?? 'brief';
    this.step = saved?.step ?? 0;
  }

  /* ---------------- Inside a stage ---------------- */

  /** The Do or Observe lines of a stage, with plain strings expanded. */
  steps(stage: Stage, phase: 'do' | 'observe'): StepDetail[] {
    return stage[phase].map((s: Step) => (typeof s === 'string' ? { text: s } : s));
  }

  /** How many items the phase is walked through one by one; 0 for phases shown whole. */
  itemCount(phase: Phase, stage: Stage = this.currentStage): number {
    if (phase === 'do' || phase === 'observe') return stage[phase].length;
    return 0;
  }

  /** Phases the stage actually has: one without Observe lines skips it. */
  readonly phases = $derived.by(() =>
    PHASES.filter((p) => {
      if (p === 'do' || p === 'observe') return this.currentStage[p].length > 0;
      if (p === 'read') return this.currentStage.read.length > 0;
      return true;
    }),
  );

  readonly stageProgress = $derived.by(() => this.progress[this.currentStage.id] ?? emptyProgress());

  setPhase(phase: Phase, step = 0): void {
    this.phase = phase;
    this.step = Math.max(0, Math.min(step, Math.max(0, this.itemCount(phase) - 1)));
    this.selected = null;
    this.module = null;
    this.#clearOverviews();
    this.#remember();
  }

  /** Next item in the phase, or on to the next phase after the last one. */
  forward(): void {
    const count = this.itemCount(this.phase);
    if (this.step < count - 1) return this.setPhase(this.phase, this.step + 1);
    const next = this.phases[this.phases.indexOf(this.phase) + 1];
    if (next) this.setPhase(next);
  }

  back(): void {
    if (this.step > 0) return this.setPhase(this.phase, this.step - 1);
    const previous = this.phases[this.phases.indexOf(this.phase) - 1];
    if (previous) this.setPhase(previous, this.itemCount(previous) - 1);
  }

  /** Closes the stage: on to the next one, from its start. */
  complete(): void {
    const next = this.stage + 1;
    if (next > this.stageCount) return;
    this.#update({ phase: 'done', step: 0 });
    this.goto(next);
    this.setPhase('brief');
  }

  markRead(id: string): void {
    const read = this.stageProgress.read;
    if (!read.includes(id)) this.#update({ read: [...read, id] });
  }

  note(key: string): string {
    return this.stageProgress.notes[key] ?? '';
  }

  setNote(key: string, text: string): void {
    this.#update({ notes: { ...this.stageProgress.notes, [key]: text } });
  }

  /**
   * Loads what the browser remembers and opens where the learner left off, or
   * where the address points. Called once the page runs in a browser.
   */
  restore(target: { stage: string; phase?: Phase; step?: number } | null): void {
    this.progress = load(mapKey(this.map), 'progress', {});
    const id = target?.stage ?? load<string | null>(mapKey(this.map), 'last', null);
    const stage = this.map.stages.find((s) => s.id === id);
    // Set directly rather than through goto(), which would first save the
    // stage being left and so overwrite what was just loaded.
    if (stage) this.stage = stage.order;
    const saved = this.progress[this.currentStage.id];
    this.phase = saved?.phase ?? 'brief';
    this.step = saved?.step ?? 0;
    if (target?.phase && this.phases.includes(target.phase)) this.setPhase(target.phase, target.step ?? 0);
  }

  #remember(): void {
    this.#update({ phase: this.phase, step: this.step });
    save(mapKey(this.map), 'last', this.currentStage.id);
  }

  #update(patch: Partial<StageProgress>): void {
    const id = this.currentStage.id;
    this.progress = { ...this.progress, [id]: { ...(this.progress[id] ?? emptyProgress()), ...patch } };
    save(mapKey(this.map), 'progress', this.progress);
  }

  select(id: string | null): void {
    // Selecting something the focused view hides means the user wants to see it.
    if (id && !this.visible(this.map.byId[id])) this.view = 'full';
    this.selected = id;
    this.module = null;
    if (id) this.#clearOverviews();
    if (id) this.showPanel();
  }

  selectModule(id: string | null): void {
    this.module = id;
    this.selected = null;
    this.hoveredModule = null;
    if (id) this.#clearOverviews();
    if (id) this.showPanel();
  }

  selectPeriod(period: number | null): void {
    this.#clearOverviews();
    this.period = period;
    this.selected = null;
    this.module = null;
    if (period !== null) this.showPanel();
  }

  selectRegion(id: string | null): void {
    this.#clearOverviews();
    this.region = id;
    this.selected = null;
    this.module = null;
    if (id) this.showPanel();
  }

  selectKind(id: string | null): void {
    this.#clearOverviews();
    this.kind = id;
    this.selected = null;
    this.module = null;
    if (id) this.showPanel();
  }

  /** Closes a day, region or kind overview. */
  #clearOverviews(): void {
    this.period = null;
    this.region = null;
    this.kind = null;
  }

  /** Picking something to read about brings the details panel back if it was put away. */
  showPanel(): void {
    const panel = this.panel;
    if (!panel) return;
    if (panel.isMobile) panel.setOpenMobile(true);
    else if (!panel.open) panel.setOpen(true);
  }

  setView(view: View): void {
    this.view = view;
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }
}

const KEY = Symbol('onboarding-map-state');

export function setAppState(map: DerivedMap): AppState {
  return setContext(KEY, new AppState(map));
}

export function getAppState(): AppState {
  return getContext<AppState>(KEY);
}
