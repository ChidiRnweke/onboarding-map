<script lang="ts">
  import type { RouteSegment } from '$lib/map/layout';
  import { getAppState } from '$lib/state.svelte';

  let { route }: { route: RouteSegment[] } = $props();

  const app = getAppState();

  let groups = $state<Record<number, SVGGElement>>({});
  let previousStage = 0;

  /**
   * Draw the current leg on as the journey advances. The original animated this
   * with a d3 transition; a CSS transition on stroke-dashoffset does the same
   * and keeps d3 out of the render path.
   */
  $effect(() => {
    const stage = app.stage;
    const advanced = stage > previousStage;
    previousStage = stage;
    // Re-run when the paths change too, so a rebuilt map is never left mid-animation.
    void route;

    const group = groups[stage];
    if (!group) return;

    const paths = [...group.querySelectorAll<SVGPathElement>('.route-main, .route-glow')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!advanced || reduced) {
      for (const path of paths) {
        path.style.transition = 'none';
        path.style.strokeDasharray = '';
        path.style.strokeDashoffset = '';
      }
      return;
    }

    for (const path of paths) {
      const length = path.getTotalLength();
      path.style.transition = 'none';
      path.style.strokeDasharray = `${length} ${length}`;
      path.style.strokeDashoffset = `${length}`;
      // Force the start state to apply before transitioning away from it.
      void path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.645, 0.045, 0.355, 1)';
      path.style.strokeDashoffset = '0';
    }
  });
</script>

<!-- The route: a transit line on a track just inside the item ring. -->
<g>
  {#each route as segment (segment.order)}
    {@const done = segment.order <= app.stage}
    <g bind:this={groups[segment.order]}>
      <path
        class="route-glow fill-none stroke-route opacity-[0.14] [stroke-linecap:round] [stroke-width:10]"
        d={segment.d}
        style="display: {done ? '' : 'none'}"
      />
      <path
        class="route-main fill-none stroke-route [stroke-linecap:round] {done
          ? '[stroke-width:3]'
          : 'opacity-[0.45] [stroke-dasharray:2_6] [stroke-width:1.5]'}"
        d={segment.d}
        style="display: {done || app.showAll ? '' : 'none'}"
      />
      <path
        class="route-flow animate-[flow_1.2s_linear_infinite] fill-none stroke-paper motion-reduce:animate-none [stroke-dasharray:1_11] [stroke-linecap:round] [stroke-width:1.4]"
        d={segment.d}
        style="display: {segment.order === app.stage ? '' : 'none'}"
      />
    </g>
  {/each}
</g>
