<script lang="ts">
  import { getAppState } from '$lib/state.svelte';

  // A part of the goal as a small pill, its fill telling how far it is built,
  // as in the big picture: solid when done, soft while under way, dashed ahead.
  let { id }: { id: string } = $props();

  const app = getAppState();
  const module = $derived(app.map.moduleById[id]);
  const state = $derived(app.moduleState(module));
</script>

<button
  class="module-chip type-small inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border border-rule-soft bg-paper py-1 pr-3 pl-2 font-[600] text-ink hover:border-ink-2"
  onclick={() => app.selectModule(id)}
  onmouseenter={() => (app.hoveredModule = id)}
  onmouseleave={() => (app.hoveredModule = null)}
>
  <span
    class="h-2.5 w-3.5 flex-none rounded-[3px] border-[1.5px] {state === 'done'
      ? 'border-route bg-route'
      : state === 'current'
        ? 'border-route bg-route-soft'
        : 'border-dashed border-muted'}"
  ></span>
  {module.title}
</button>
