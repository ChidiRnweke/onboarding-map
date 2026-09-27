<script lang="ts">
  import type { LeafPlacement } from '$lib/map/layout';
  import { getAppState } from '$lib/state.svelte';
  import MapLeaf from './MapLeaf.svelte';

  let { leaves }: { leaves: LeafPlacement[] } = $props();

  const app = getAppState();

  /** Items joined by an edge to whatever the pointer or the panel is on. */
  const related = $derived.by(() => {
    const focus = [app.hovered, app.selected].filter(Boolean) as string[];
    // Rebuilt by the derived whenever its inputs change; never mutated after.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const ids = new Set<string>();
    if (!focus.length) return ids;
    for (const edge of app.map.edges) {
      if (focus.includes(edge.from) || focus.includes(edge.to)) {
        ids.add(edge.from);
        ids.add(edge.to);
      }
    }
    return ids;
  });
</script>

<g>
  {#each leaves as placement (placement.node.id)}
    <!-- Its own group, so fading in and out of a view doesn't fight the fog opacity. -->
    <g
      style:opacity={placement.presence < 1 ? placement.presence : null}
      class:pointer-events-none={placement.presence < 1}
    >
      <MapLeaf {placement} related={related.has(placement.node.id)} />
    </g>
  {/each}
</g>
