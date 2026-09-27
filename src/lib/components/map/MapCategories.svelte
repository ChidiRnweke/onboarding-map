<script lang="ts">
  import type { CategoryPlacement } from '$lib/map/layout';
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';

  let { categories }: { categories: CategoryPlacement[] } = $props();

  const app = getAppState();
  const theme = getTheme();
</script>

<!-- A bracket spanning each category's items, with the label reading inwards. -->
<g>
  {#each categories as placement (placement.node.id)}
    {@const lit = app.known(placement.node)}
    {@const tone = theme.tone(placement.node.domain)}
    <g
      style:opacity={placement.presence < 1 ? placement.presence : null}
      class:pointer-events-none={placement.presence < 1}
    >
      <path
        class="fill-none transition-opacity duration-500 [stroke-linecap:round] [stroke-width:2]"
        d={placement.bracket}
        stroke={tone}
        style="opacity: {lit ? 0.9 : 0.2}"
      />
      <text
        class="stroke-paper font-sans text-[15.5px] font-semibold transition-opacity duration-500 [font-stretch:88%] [paint-order:stroke] [stroke-linejoin:round] [stroke-width:4px]"
        transform="rotate({(placement.a * 180) / Math.PI - 90}) translate({placement.r},0){placement.flip
          ? ' rotate(180)'
          : ''}"
        x={placement.flip ? 12 : -12}
        dy="0.34em"
        text-anchor={placement.flip ? 'start' : 'end'}
        fill={tone}
        style="opacity: {lit ? 1 : 0.2}">{placement.node.label}</text
      >
    </g>
  {/each}
</g>
