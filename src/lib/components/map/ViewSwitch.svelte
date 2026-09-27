<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import type { View } from '$lib/map/layout';

  const app = getAppState();
  const labels = $derived(app.map.labels);

  const views: View[] = ['focus', 'full'];
</script>

<div
  class="view-switch pointer-events-auto flex h-[34px] flex-none items-stretch gap-[2px] rounded-full border border-rule bg-paper-2 p-[3px]"
  role="group"
  aria-label={labels.view.label}
>
  {#each views as view (view)}
    <!-- not-aria-pressed keeps the hover colour off the selected button, which
         the stylesheet did with :hover:not([aria-pressed="true"]). -->
    <button
      class="flex cursor-pointer items-center rounded-full border-0 bg-transparent type-small px-3 py-0 text-ink-2 not-aria-pressed:hover:text-ink aria-pressed:bg-ink aria-pressed:text-paper max-[860px]:px-[10px] max-[860px]:text-[12.5px]"
      aria-pressed={app.view === view}
      onclick={() => app.setView(view)}
    >
      {labels.view[view]}
    </button>
  {/each}
</div>
