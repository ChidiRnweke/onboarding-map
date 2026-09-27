<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import { motion } from '$lib/motion';
  import { getAppState, type ModuleState } from '$lib/state.svelte';
  import type { DerivedModule } from '$core/model';

  /**
   * The goal as one picture: its parts stacked by what they build on, with the
   * relation written on every link. It is the frame the rest of the app keeps
   * pointing back to, so it comes in two sizes: the full picture, and a compact
   * one that fits in a corner as "you are here".
   *
   * `at` shows the parts as they stand at that stage (default: the current
   * one), which is how a stage can show its before and after. `focus` rings
   * the part a view is about. Without `onpick`, clicking a part opens it in the
   * panel.
   */
  let {
    width = 340,
    at,
    focus = null,
    compact = false,
    stateOf,
    onpick,
  }: {
    width?: number;
    at?: number;
    /** One part, or several, to ring. */
    focus?: string | string[] | null;
    compact?: boolean;
    /** Overrides the state of every part, e.g. to leave all but one sketched. */
    stateOf?: (m: DerivedModule) => ModuleState;
    onpick?: (id: string) => void;
  } = $props();

  const app = getAppState();
  const goal = $derived(app.map.goal!);
  const labels = $derived(app.map.labels);

  const H_BOX = $derived(compact ? 24 : 46);
  const GAP_X = $derived(compact ? 6 : 10);
  // Full size leaves room between rows for the relation verbs.
  const GAP_Y = $derived(compact ? 12 : 38);
  const GOAL_H = $derived(compact ? 20 : 34);

  const focused = $derived(new Set(focus === null ? [] : Array.isArray(focus) ? focus : [focus]));

  const state = (m: DerivedModule): ModuleState =>
    stateOf ? stateOf(m) : app.moduleStateAt(m, at ?? app.stage);

  interface Box {
    module: DerivedModule;
    x: number;
    y: number;
    w: number;
    h: number;
  }

  // Modules stacked by dependency depth: foundations at the bottom, the goal on top.
  const geometry = $derived.by(() => {
    const modules = app.map.modules;
    const maxDepth = Math.max(...modules.map((m) => m.depth));
    const pos: Record<string, Box> = {};

    for (let depth = 0; depth <= maxDepth; depth++) {
      const row = modules
        .filter((m) => m.depth === depth)
        .sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0));
      const r = maxDepth - depth;
      const w = Math.min(compact ? 110 : 158, (width - (row.length - 1) * GAP_X) / row.length);
      const x0 = (width - (row.length * w + (row.length - 1) * GAP_X)) / 2;
      row.forEach((module, i) => {
        pos[module.id] = {
          module,
          x: x0 + i * (w + GAP_X),
          y: GOAL_H + GAP_Y + r * (H_BOX + GAP_Y),
          w,
          h: H_BOX,
        };
      });
    }

    const height = GOAL_H + GAP_Y + (maxDepth + 1) * (H_BOX + GAP_Y) - GAP_Y + 4;
    return { pos, height, boxes: modules.map((m) => pos[m.id]) };
  });

  const vline = (x1: number, y1: number, x2: number, y2: number) => {
    const my = (y1 + y2) / 2;
    return `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
  };

  const verbOf = (m: DerivedModule, dep: string) =>
    m.relations?.find((r) => r.to === dep)?.verb ?? labels.bigPicture.buildsOn;

  const links = $derived.by(() => {
    const { pos } = geometry;
    const out: { d: string; live: boolean; verb?: string; x: number; y: number }[] = [];

    for (const module of app.map.modules) {
      const a = pos[module.id];
      const built = state(module) !== 'ahead';
      for (const dep of module.dependsOn) {
        const b = pos[dep];
        const [x1, y1, x2, y2] = [a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y];
        out.push({
          d: vline(x1, y1, x2, y2),
          live: built && state(app.map.moduleById[dep]) !== 'ahead',
          verb: verbOf(module, dep),
          // The midpoint of the curve, where the verb sits.
          x: (x1 + x2) / 2,
          y: (y1 + y2) / 2,
        });
      }
      if (!module.neededBy.length) {
        out.push({
          d: `M${a.x + a.w / 2},${a.y} L${a.x + a.w / 2},${GOAL_H}`,
          live: built,
          x: 0,
          y: 0,
        });
      }
    }
    return out;
  });

  // One ring that glides from part to part rather than jumping, and fades out
  // while nothing is in focus. Several parts in focus get a ring each.
  const single = $derived(focused.size === 1 ? geometry.pos[[...focused][0]] : null);
  const ring = new Tween({ x: 0, y: 0, w: 0, h: 0 }, { easing: cubicOut });
  // Not state: whether the ring was on screen the last time, so it only glides
  // from somewhere it was seen.
  let ringShown = false;
  $effect(() => {
    if (single) {
      const { x, y, w, h } = single;
      ring.set({ x, y, w, h }, { duration: ringShown ? motion(450) : 0 });
    }
    ringShown = !!single;
  });

  const stageOf = (m: DerivedModule) => app.map.stages.find((s) => s.order === m.stageOrder)!;
  const done = $derived(app.map.modules.filter((m) => state(m) === 'done').length);

  // The state is resolved here and the classes go straight on the rect and the
  // text, rather than reaching in from a state class on the group.
  const boxRect = (state: ModuleState, selected: boolean) => {
    const base = 'transition-[fill,stroke] duration-600 ease-out';
    const stroke = selected ? 'stroke-ink [stroke-width:2.5]' : '';
    if (state === 'done') return `${base} fill-route stroke-route [stroke-width:1.5] ${stroke}`;
    if (state === 'current') return `${base} fill-route-soft stroke-route [stroke-width:2] ${stroke}`;
    // ahead: a dashed sketch, unless it is the selected one, which drops the dash
    return `${base} fill-transparent stroke-muted [stroke-width:1.5] ${
      selected ? 'stroke-ink [stroke-width:2.5] [stroke-dasharray:none]' : '[stroke-dasharray:4_3]'
    }`;
  };

  // On the current box the title is ink and the subtitle ink-2; done boxes are
  // reversed out of the fill, and parts not started yet are greyed.
  const boxTitle = (state: ModuleState) =>
    state === 'done' ? 'fill-paper' : state === 'ahead' ? 'fill-ink-2' : 'fill-ink';
  const boxSub = (state: ModuleState) => (state === 'done' ? 'fill-paper' : 'fill-ink-2');

  // Long titles are shrunk to fit their box.
  const titleSize = (m: DerivedModule, w: number) =>
    Math.min(compact ? 10.5 : 13.5, (w - (compact ? 12 : 22)) / (m.title.length * 0.55)).toFixed(1);

  function pick(id: string) {
    if (onpick) onpick(id);
    else app.selectModule(id);
  }

  function activate(id: string, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pick(id);
    }
  }
</script>

<svg
  class="blueprint block h-auto w-full overflow-visible"
  viewBox="0 0 {width} {geometry.height}"
  role="img"
  aria-label={goal.title}
>
  {#each links as link, i (i)}
    <path
      class="fill-none transition-[stroke] duration-600 ease-out [stroke-width:1.5] {link.live
        ? 'stroke-route'
        : 'stroke-rule'}"
      d={link.d}
    />
  {/each}
  {#if !compact}
    {#each links as link, i (i)}
      {#if link.verb}
        <!-- The paper-coloured stroke behind the letters clears the line under them. -->
        <text
          class="{link.live
            ? 'fill-route'
            : 'fill-ink-2'} stroke-paper font-serif transition-[fill] duration-600 ease-out text-[11.5px] italic [paint-order:stroke] [stroke-linejoin:round] [stroke-width:4px]"
          x={link.x}
          y={link.y + 4}
          text-anchor="middle">{link.verb}</text
        >
      {/if}
    {/each}
  {/if}

  <g>
    <rect
      x="1"
      y="1"
      width={width - 2}
      height={GOAL_H - 2}
      rx={(GOAL_H - 2) / 2}
      class="fill-none stroke-ink [stroke-width:1.5]"
    />
    <text
      class="fill-ink font-serif {compact ? 'text-[11px]' : 'text-[15px]'} font-normal italic"
      x={width / 2}
      y={GOAL_H / 2 + (compact ? 4 : 5)}
      text-anchor="middle">{goal.title}</text
    >
    {#if !compact}
      <text class="fill-ink-2 font-sans text-[11.5px]" x={width - 16} y={GOAL_H / 2 + 4} text-anchor="end"
        >{done}/{app.map.modules.length}</text
      >
    {/if}
  </g>

  <g
    class="pointer-events-none transition-opacity duration-300 {single ? 'opacity-100' : 'opacity-0'}"
    aria-hidden="true"
  >
    <rect
      x={ring.current.x - 4}
      y={ring.current.y - 4}
      width={Math.max(0, ring.current.w + 8)}
      height={ring.current.h + 8}
      rx={compact ? 8 : 12}
      class="fill-none stroke-route [stroke-width:2] motion-safe:animate-[piece-glow_1.2s_ease-in-out_infinite_alternate]"
    />
  </g>

  {#each geometry.boxes as box (box.module.id)}
    {@const s = state(box.module)}
    {@const selected = app.module === box.module.id}
    {#if focused.size > 1 && focused.has(box.module.id)}
      <rect
        x={box.x - 4}
        y={box.y - 4}
        width={box.w + 8}
        height={box.h + 8}
        rx={compact ? 8 : 12}
        class="pointer-events-none fill-none stroke-route [stroke-width:2] motion-safe:animate-[piece-glow_1.2s_ease-in-out_infinite_alternate]"
      />
    {/if}
    <g
      class="bp-box group cursor-pointer focus:outline-none"
      role="button"
      tabindex="0"
      aria-label={box.module.title}
      aria-current={focused.has(box.module.id) ? 'true' : undefined}
      onclick={() => pick(box.module.id)}
      onkeydown={(e) => activate(box.module.id, e)}
      onmouseenter={() => (app.hoveredModule = box.module.id)}
      onmouseleave={() => (app.hoveredModule = null)}
    >
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={compact ? 6 : 9}
        class="{boxRect(s, selected)} group-hover:stroke-ink group-focus-visible:stroke-ink"
      />
      <text
        class="{boxTitle(
          s,
        )} font-sans font-semibold transition-[fill] duration-600 ease-out [font-stretch:90%]"
        x={box.x + (compact ? 7 : 12)}
        y={box.y + (compact ? 16 : 20)}
        style="font-size:{titleSize(box.module, box.w)}px">{box.module.title}</text
      >
      {#if !compact}
        <text
          class="{boxSub(s)} font-sans text-[11.5px] transition-[fill] duration-600 ease-out"
          x={box.x + 12}
          y={box.y + 36}
          >{(box.module.startOrder ?? 0) < (box.module.stageOrder ?? 0)
            ? `${box.module.startOrder}–${box.module.stageOrder}`
            : stageOf(box.module).order} · {stageOf(box.module).title}{box.module.optional
            ? ', ' + labels.goal.optional.toLowerCase()
            : ''}</text
        >
      {/if}
    </g>
  {/each}
</svg>
