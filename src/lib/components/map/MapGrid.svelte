<script lang="ts">
  import type { Grid } from '$lib/map/layout';

  let { grid }: { grid: Grid } = $props();
</script>

<!-- The survey graticule the map is drawn over. -->
<g>
  {#each grid.rings as r (r)}
    <circle class="fill-none stroke-rule-soft" {r} />
  {/each}

  {#each grid.spokes as spoke, i (i)}
    <line
      class="stroke-rule-soft"
      x1={spoke.x1}
      y1={spoke.y1}
      x2={spoke.x2}
      y2={spoke.y2}
      stroke-width="0.6"
    />
  {/each}

  <circle class="fill-none stroke-rule" r={grid.rimOuter} stroke-width="1" />
  <circle class="fill-none stroke-rule" r={grid.rimInner} stroke-width="0.5" />

  {#each grid.ticks as tick, i (i)}
    <line class="stroke-rule" x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
  {/each}
</g>
