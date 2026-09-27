<script lang="ts">
  import type { Layout } from '$lib/map/layout';
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';

  // The whole map in miniature while the main map is zoomed in: the regions,
  // the route, and a frame around the part on screen. Clicking it zooms back
  // out to the whole.
  let {
    layout,
    lit,
    view,
    size,
    zoomed,
    onreset,
  }: {
    layout: Layout;
    lit: Record<string, boolean>;
    view: { x: number; y: number; k: number };
    size: { width: number; height: number };
    zoomed: boolean;
    onreset: () => void;
  } = $props();

  const app = getAppState();
  const theme = getTheme();
  const labels = $derived(app.map.labels);

  const E = $derived(layout.R.extent);
  // What the main map shows, in map units: the screen's corners, un-zoomed.
  const frame = $derived({
    x: -view.x / view.k,
    y: -view.y / view.k,
    w: size.width / view.k,
    h: size.height / view.k,
  });
  const waypoints = $derived(layout.leaves.filter((l) => l.waypoint === app.stage));
</script>

{#if zoomed}
  <button
    class="minimap absolute top-[70px] left-[18px] z-[1] h-[150px] w-[150px] cursor-pointer overflow-hidden rounded-[14px] border border-rule-soft bg-[color-mix(in_srgb,var(--paper-2)_90%,transparent)] p-1.5 backdrop-blur-[6px] hover:border-ink-2 @max-[520px]:hidden"
    aria-label={labels.aria.fit}
    title={labels.aria.fit}
    onclick={onreset}
  >
    <svg class="block h-full w-full" viewBox="{-E} {-E} {E * 2} {E * 2}" aria-hidden="true">
      {#each layout.domains as placement (placement.domain.id)}
        <path
          d={placement.wedge}
          fill={theme.tone(placement.domain.id)}
          fill-opacity={lit[placement.domain.id] ? 0.35 : 0.08}
        />
      {/each}
      {#each layout.route as segment (segment.order)}
        <path
          d={segment.d}
          fill="none"
          class={segment.order <= app.stage ? 'stroke-route' : 'stroke-muted'}
          stroke-width={E / 60}
          stroke-linecap="round"
        />
      {/each}
      {#each waypoints as leaf (leaf.node.id)}
        <circle cx={leaf.x} cy={leaf.y} r={E / 40} class="fill-route" />
      {/each}
      <rect
        x={frame.x}
        y={frame.y}
        width={frame.w}
        height={frame.h}
        rx={E / 50}
        class="fill-route-soft stroke-route"
        stroke-width={E / 80}
      />
    </svg>
  </button>
{/if}
