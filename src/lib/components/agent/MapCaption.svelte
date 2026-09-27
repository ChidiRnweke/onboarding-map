<script lang="ts">
  import CrosshairIcon from '@lucide/svelte/icons/crosshair';
  import XIcon from '@lucide/svelte/icons/x';
  import { fly } from 'svelte/transition';
  import { motion } from '$lib/motion';
  import { getAppState } from '$lib/state.svelte';

  // What the assistant is pointing at on the map, and why: the caption it gave
  // when it lit the concepts up. It stays until the learner picks something
  // themselves or dismisses it.
  const app = getAppState();
</script>

{#if app.agentFocus}
  <div
    class="type-small pointer-events-auto mb-2 flex max-w-[min(420px,100%)] items-center gap-2 rounded-full border border-route bg-panel py-1 pr-1 pl-3 text-ink shadow-sm"
    role="status"
    transition:fly={{ y: 6, duration: motion(160) }}
  >
    <CrosshairIcon size={14} class="flex-none text-route" />
    <span class="min-w-0 truncate"
      >{app.agentFocus.caption || `${app.agentFocus.ids.length} highlighted`}</span
    >
    <button
      class="grid size-6 flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-2 hover:bg-route-soft hover:text-ink"
      aria-label="Clear"
      onclick={() => (app.agentFocus = null)}><XIcon size={13} /></button
    >
  </div>
{/if}
