<script lang="ts">
  import type { DomainPlacement } from '$lib/map/layout';
  import { getTheme } from '$lib/theme.svelte';

  let { domains, lit }: { domains: DomainPlacement[]; lit: Record<string, boolean> } = $props();

  const theme = getTheme();
</script>

<!-- One soft wedge per region of the map. -->
<g>
  {#each domains as placement (placement.domain.id)}
    <path
      class="transition-[fill-opacity] duration-[600ms]"
      d={placement.wedge}
      fill={theme.tone(placement.domain.id)}
      style="fill-opacity: {lit[placement.domain.id] ? 'var(--wash)' : '0.035'}"
      style:opacity={placement.presence < 1 ? placement.presence : null}
    />
  {/each}
</g>
