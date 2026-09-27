<script lang="ts">
  import { getAppState } from '$lib/state.svelte';

  let { id }: { id: string } = $props();

  const app = getAppState();
</script>

<!-- A real <button> handles Enter and Space natively, so unlike the original
     this needs no explicit keydown handler. -->
<button
  class="module-ref cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-[650] text-route underline decoration-route-soft underline-offset-[3px] hover:decoration-current"
  onclick={() => app.selectModule(id)}
  onmouseenter={() => (app.hoveredModule = id)}
  onmouseleave={() => (app.hoveredModule = null)}>{app.map.moduleById[id].title}</button
>
