<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';

  // A concept as a small pill, wearing its region's colour: clicking opens it,
  // hovering finds it on the map. Used wherever concepts are listed, so a
  // neighbourhood reads like the map rather than like a list.
  let { id }: { id: string } = $props();

  const app = getAppState();
  const theme = getTheme();
  const node = $derived(app.map.byId[id]);
</script>

<button
  class="node-chip type-small inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border border-rule-soft bg-paper py-1 pr-3 pl-2 text-left text-ink hover:border-ink-2"
  onclick={() => app.select(id)}
  onmouseenter={() => (app.hovered = id)}
  onmouseleave={() => (app.hovered = null)}
>
  <span class="size-2 flex-none rounded-full" style="background:{theme.tone(node.domain)}"></span>
  <span class="truncate">{node.label}</span>
</button>
