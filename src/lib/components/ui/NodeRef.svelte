<script lang="ts">
  import { getAppState } from '$lib/state.svelte';

  let { id }: { id: string } = $props();

  const app = getAppState();
</script>

<button
  class="node-ref cursor-pointer border-0 bg-transparent p-0 text-left underline decoration-rule underline-offset-[3px] hover:decoration-current"
  onclick={() => app.select(id)}>{app.map.byId[id].label}</button
>
