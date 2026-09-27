<script lang="ts">
  import { untrack } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { select } from 'd3-selection';
  // Imported for its side effect: it is what gives a selection .transition(),
  // used by the zoom buttons and by fit().
  import 'd3-transition';
  import { zoom as d3Zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from 'd3-zoom';
  import { LEAF_LABEL, LEAF_LABEL_PATH } from '$lib/map/classes';
  import { blendPositions, buildLayout, computePositions, type Positions } from '$lib/map/layout';
  import { getAppState } from '$lib/state.svelte';
  import MapCategories from './MapCategories.svelte';
  import MapCenter from './MapCenter.svelte';
  import MapGrid from './MapGrid.svelte';
  import MapLeaves from './MapLeaves.svelte';
  import MapMinimap from './MapMinimap.svelte';
  import MapRegions from './MapRegions.svelte';
  import MapRelations from './MapRelations.svelte';
  import MapRoute from './MapRoute.svelte';
  import MapWedges from './MapWedges.svelte';

  const app = getAppState();

  let svgEl = $state<SVGSVGElement | null>(null);
  let transform = $state('');

  /**
   * Width of the longest item label, in map units. It can only be known by
   * measuring rendered text, so the map is laid out once with a rough estimate
   * and again once the real metrics are available.
   */
  let labelWidth = $state(0);

  /**
   * The map is only drawn once labels have been measured. On the server that
   * never happens, so the SVG renders empty — matching the original, which drew
   * nothing until its script ran, and avoiding a re-layout on hydration.
   */
  let measured = $state(false);

  /** Where the current view settles. */
  const target = $derived(computePositions(app.map, app.view, labelWidth));

  /**
   * Switching views morphs one layout into the other: `from` is where the map
   * was when the switch happened, and `progress` (eased, 0 to 1) runs from it
   * to `target`. Driven by requestAnimationFrame: svelte/motion's Tween, set
   * from the effect below, ticked without the layout ever seeing its updates.
   */
  let from = $state.raw<Positions | null>(null);
  let progress = $state(1);
  let frame = 0;

  function play(duration = 750) {
    cancelAnimationFrame(frame);
    const start = performance.now();
    progress = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      progress = cubicInOut(k);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }

  $effect(() => () => cancelAnimationFrame(frame));

  let settled: Positions | null = null;
  let settledView = app.view;

  // Before the DOM updates, so the new view is never drawn for a frame first.
  $effect.pre(() => {
    const next = target;
    const view = app.view;
    untrack(() => {
      const previous = settled;
      const animate =
        previous &&
        measured &&
        view !== settledView &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (animate) {
        // Start from wherever the map is now, even part way through a switch.
        from = blendPositions(from ?? previous, previous, progress);
        play();
      } else if (progress < 1) {
        // The new view's labels were measured mid-switch (its longest label
        // differs): keep going, towards the corrected target.
      } else {
        // First draw, new label metrics or new data: no view change to show.
        from = next;
        cancelAnimationFrame(frame);
        progress = 1;
      }
      settled = next;
      settledView = view;
    });
  });

  const layout = $derived(buildLayout(app.map, blendPositions(from ?? target, target, progress)));

  /** Regions that contain at least one item the journey has reached. */
  const lit = $derived.by(() => {
    const out: Record<string, boolean> = {};
    for (const { domain } of layout.domains) {
      out[domain.id] = layout.leaves.some((l) => l.node.domain === domain.id && app.known(l.node));
    }
    return out;
  });

  /* ---------------- measurement ---------------- */
  $effect(() => {
    const svg = svgEl;
    if (!svg) return;

    const measure = () => {
      const holder = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const probe = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      // Must match a real label exactly, including the heavier route weight:
      // the original probe sat inside a .leaf.path, so every label was measured
      // at 600. Measuring at 400 makes the longest label ~7 units narrower and
      // lays the whole map out at the wrong radius.
      probe.setAttribute('class', `${LEAF_LABEL} ${LEAF_LABEL_PATH}`);
      probe.style.visibility = 'hidden';
      holder.appendChild(probe);
      svg.appendChild(holder);

      // The settled view's labels, not the animated layout's, so this doesn't
      // re-run on every frame of a view switch.
      let widest = 0;
      for (const node of app.map.nodes) {
        if (node.kind === 'category' || !target.presence[node.id]) continue;
        probe.textContent = node.label;
        widest = Math.max(widest, probe.getComputedTextLength());
      }
      holder.remove();

      if (Math.abs(widest - labelWidth) > 0.5) labelWidth = widest;
      measured = true;
    };

    measure();
    // Label widths change once the web fonts arrive; measure again for real.
    document.fonts?.ready.then(measure);
  });

  /* ---------------- zoom ---------------- */
  let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null;

  /** The live zoom transform and the map's size on screen, for the minimap. */
  let view = $state({ x: 0, y: 0, k: 1 });
  let size = $state({ width: 0, height: 0 });
  /** The scale at which the whole map fits. */
  const fitScale = $derived(
    size.width && size.height ? (Math.min(size.width, size.height) / (layout.R.extent * 2)) * 0.98 : 1,
  );

  /**
   * The camera's current move, so a resize can finish it rather than cut it:
   * when it started, how long it runs, and its easing.
   */
  let move: { start: number; duration: number; ease: (t: number) => number } | null = null;

  function apply(
    t: ReturnType<typeof zoomIdentity.scale>,
    duration: number,
    ease: (t: number) => number = cubicInOut,
    continuing = false,
  ) {
    const svg = svgEl;
    if (!svg || !zoomBehavior) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = select(svg);
    if (duration && !reduce) {
      if (!continuing) move = { start: performance.now(), duration, ease };
      target.transition().duration(duration).ease(ease).call(zoomBehavior.transform, t);
    } else {
      move = null;
      target.call(zoomBehavior.transform, t);
    }
  }

  /**
   * Re-aims a move that is under way at the map's new size, finishing on the
   * original schedule along the rest of the original easing curve, so the
   * motion carries on at the speed it had instead of starting over.
   */
  function continueMove(): boolean {
    if (!move) return false;
    const p0 = (performance.now() - move.start) / move.duration;
    if (p0 >= 0.95) return false;
    const { ease } = move;
    const e0 = ease(p0);
    const rest = (u: number) => (ease(p0 + u * (1 - p0)) - e0) / (1 - e0);
    aim((1 - p0) * move.duration, rest, true);
    return true;
  }

  export function fit(duration = 0, ease: (t: number) => number = cubicInOut, continuing = false) {
    const svg = svgEl;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    if (!width || !height) return;

    const k = (Math.min(width, height) / (layout.R.extent * 2)) * 0.98;
    apply(zoomIdentity.translate(width / 2, height / 2 - 10).scale(k), duration, ease, continuing);
  }

  /**
   * Frames a set of nodes: the box around their dots and their labels, which
   * run outward from the rim, never closer in than the whole map and never
   * more than three times closer.
   */
  export function focusOn(
    ids: string[],
    duration = 0,
    ease: (t: number) => number = cubicInOut,
    continuing = false,
  ) {
    const svg = svgEl;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    if (!width || !height) return;

    const placed = ids.map((id) => layout.byId[id]).filter((p) => p && p.presence > 0);
    if (!placed.length) return fit(duration, ease, continuing);

    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const p of placed) {
      // The route runs on a track just inside the ring; the label ends a
      // label's width outside it.
      for (const r of [layout.track, p.r + labelWidth + 8]) {
        const x = Math.sin(p.a) * r;
        const y = -Math.cos(p.a) * r;
        [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      }
    }
    const pad = 24;
    const whole = (Math.min(width, height) / (layout.R.extent * 2)) * 0.98;
    const k = Math.max(
      whole,
      Math.min(whole * 3, Math.min(width / (x1 - x0 + pad * 2), height / (y1 - y0 + pad * 2)) * 0.9),
    );
    const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
    apply(
      zoomIdentity.translate(width / 2 - cx * k, height / 2 - 10 - cy * k).scale(k),
      duration,
      ease,
      continuing,
    );
  }

  /**
   * Points the map at whatever the learner is looking at, or shows it whole.
   * When none of those nodes is on the map (they sit in a slice the focused
   * view hides), the current stage's route stands in for them.
   */
  function aim(duration = 0, ease: (t: number) => number = cubicInOut, continuing = false) {
    const ids = app.cameraFocus;
    if (!ids?.length) return fit(duration, ease, continuing);
    const shown = ids.some((id) => (layout.byId[id]?.presence ?? 0) > 0);
    focusOn(shown ? ids : app.currentStage.waypoints, duration, ease, continuing);
  }

  export function zoomIn() {
    if (svgEl && zoomBehavior) select(svgEl).transition().duration(300).call(zoomBehavior.scaleBy, 1.4);
  }

  export function zoomOut() {
    if (svgEl && zoomBehavior)
      select(svgEl)
        .transition()
        .duration(300)
        .call(zoomBehavior.scaleBy, 1 / 1.4);
  }

  $effect(() => {
    const svg = svgEl;
    if (!svg) return;

    zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 5])
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        transform = event.transform.toString();
        view = { x: event.transform.x, y: event.transform.y, k: event.transform.k };
      });

    select(svg).call(zoomBehavior).on('dblclick.zoom', null);

    // A resize keeps the map aimed where it was aimed. When it happens while
    // the camera is moving (the panel widens for Do as the map zooms in), the
    // move carries on towards the target at the new size; cutting it would
    // jump straight to the end.
    const observer = new ResizeObserver(() => {
      const { width, height } = svg.getBoundingClientRect();
      size = { width, height };
      untrack(() => continueMove() || aim());
    });
    observer.observe(svg);

    return () => {
      observer.disconnect();
      select(svg).on('.zoom', null);
      zoomBehavior = null;
    };
  });

  // Re-aim without animating when the geometry changes (a new view, or fresh
  // label metrics), so the frame stays on the same things.
  $effect(() => {
    void layout.R.extent;
    void measured;
    untrack(() => aim());
  });

  // Follow the learner: a new step, phase, selection or day moves the camera.
  // Manual panning and zooming stays until the next one.
  const focusKey = $derived(app.cameraFocus?.join(' ') ?? '');
  let aimed = false;
  $effect(() => {
    void focusKey;
    untrack(() => {
      // The first aim happens with the geometry above; after that, animate.
      if (aimed) aim(650);
      aimed = true;
    });
  });
</script>

<MapMinimap {layout} {lit} {view} {size} zoomed={view.k > fitScale * 1.15} onreset={() => fit(500)} />

<svg bind:this={svgEl} id="map" role="img" aria-label={app.map.labels.aria.mapImage}>
  <defs>
    {#each layout.domains as placement (placement.domain.id)}
      <path id={placement.rimId} d={placement.rim} />
    {/each}
  </defs>

  {#if measured}
    <g {transform}>
      <MapGrid grid={layout.grid} />
      <MapWedges domains={layout.domains} {lit} />
      <MapRegions domains={layout.domains} band={layout.band} {lit} />
      <MapCategories categories={layout.categories} />
      <MapRoute route={layout.route} />
      <MapRelations {layout} />
      <MapLeaves leaves={layout.leaves} />
      <MapCenter />
    </g>
  {/if}
</svg>
