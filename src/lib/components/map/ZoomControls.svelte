<script lang="ts">
  import { getAppState } from '$lib/state.svelte';

  let { zoomIn, zoomOut, fit }: { zoomIn: () => void; zoomOut: () => void; fit: () => void } = $props();

  const aria = $derived(getAppState().map.labels.aria);

  const button =
    'grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border border-rule bg-paper-2 text-[17px] leading-none hover:border-ink-2';
</script>

<div class="zoom pointer-events-auto flex flex-none gap-[6px]">
  <button class={button} aria-label={aria.zoomIn} onclick={zoomIn}>+</button>
  <button class={button} aria-label={aria.zoomOut} onclick={zoomOut}>−</button>
  <button class={button} aria-label={aria.fit} onclick={fit}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"
      ><path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" /></svg
    >
  </button>
</div>
