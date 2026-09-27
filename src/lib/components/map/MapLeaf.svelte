<script lang="ts">
  import type { LeafPlacement } from '$lib/map/layout';
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';
  import { LEAF_LABEL, LEAF_LABEL_OTHER, LEAF_LABEL_PATH } from '$lib/map/classes';

  let { placement, related }: { placement: LeafPlacement; related: boolean } = $props();

  const app = getAppState();
  const theme = getTheme();

  const node = $derived(placement.node);
  const tone = $derived(theme.tone(node.domain));
  const ahead = $derived(node.status === 'path' && (node.stageOrder ?? 0) > app.stage);

  const known = $derived(app.known(node));
  const selected = $derived(node.id === app.selected);
  const inModule = $derived(app.highlightedNodes.has(node.id));
  const current = $derived(node.status === 'path' && node.stageOrder === app.stage);

  /** Where this item sits relative to the stage the reader is on. */
  const progress = $derived.by(() => {
    if (node.status !== 'path' || node.stageOrder === undefined) return '';
    if (node.stageOrder < app.stage) return 'done';
    if (node.stageOrder === app.stage) return 'current';
    return 'ahead';
  });

  /**
   * The stylesheet layered these: .leaf.fog dimmed to var(--fog), then
   * .leaf.fog.in-module lifted it back to .75. Resolving the combination here
   * keeps it to one opacity per element instead of two competing utilities.
   */
  const dim = $derived(known ? '' : inModule ? 'opacity-[0.75]' : 'opacity-[var(--fog)]');

  // .leaf text, then .leaf.path text / .leaf.alternative text overriding it.
  const labelColour = $derived(node.status === 'path' ? LEAF_LABEL_PATH : LEAF_LABEL_OTHER);

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      app.select(node.id);
    }
  }
</script>

<!-- `related` carried no styling in the original either; it is kept because the
     original marked it, and it is useful in devtools.
     The status and progress names carry no styling now, but they are kept as
     hooks: the regression harness drives .leaf.path, and they make the SVG
     readable in devtools. `group` gives the label the hover underline. -->
<g
  class="leaf {node.status} {progress} group cursor-pointer transition-opacity duration-500 {dim}"
  class:selected
  class:related
  role="button"
  tabindex="0"
  aria-label="{node.label}, {app.map.labels.legend[node.status]}"
  transform="rotate({(placement.a * 180) / Math.PI - 90}) translate({placement.r},0)"
  onclick={() => app.select(node.id)}
  {onkeydown}
  onmouseenter={() => (app.hovered = node.id)}
  onmouseleave={() => (app.hovered = null)}
>
  <circle r="16" fill="transparent" />

  {#if current}
    <circle
      class="animate-[waypoint-pulse_2.4s_ease-out_infinite] fill-none stroke-route motion-reduce:animate-none [stroke-width:1.5] [transform-box:fill-box] [transform-origin:center]"
      r={placement.waypoint ? 10 : 7}
    />
  {/if}

  <!-- The halo is drawn for the selection and, dashed, for goal-module members. -->
  {#if selected || inModule}
    <circle
      class="fill-none stroke-route [stroke-width:1.5] {inModule && !selected
        ? '[stroke-dasharray:3_3]'
        : ''}"
      r={placement.waypoint ? 15 : 12}
    />
  {/if}

  {#if node.status === 'path'}
    <circle
      r={placement.waypoint ? 9.5 : 6.5}
      fill={ahead ? 'var(--paper)' : tone}
      stroke={ahead ? tone : 'var(--paper)'}
      stroke-width={ahead ? 1.6 : 1.5}
      stroke-dasharray={ahead ? '2.5 2' : null}
    />
  {:else if node.status === 'alternative'}
    <circle r="4.5" fill="var(--paper)" stroke="var(--muted)" stroke-width="1.5" />
  {:else}
    <circle r="3.6" fill="var(--muted)" stroke="none" />
  {/if}

  {#if placement.waypoint}
    <text
      class="pointer-events-none fill-paper text-[11px] font-semibold [font-stretch:100%] [stroke:none]"
      text-anchor="middle"
      dy="0.36em"
      transform="rotate({-((placement.a * 180) / Math.PI - 90)})"
      style="fill: {(node.stageOrder ?? 0) > app.stage ? tone : 'var(--paper)'}">{placement.waypoint}</text
    >
  {/if}

  <text
    class="{LEAF_LABEL} {labelColour} underline-offset-[3px] group-hover:underline {selected
      ? 'underline'
      : ''}"
    dy="0.34em"
    x={placement.flip ? -16 : 16}
    text-anchor={placement.flip ? 'end' : 'start'}
    transform={placement.flip ? 'rotate(180)' : null}>{node.label}</text
  >
</g>
