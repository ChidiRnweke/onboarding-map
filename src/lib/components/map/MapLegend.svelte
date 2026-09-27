<script lang="ts">
  import { onMount } from 'svelte';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import { Switch } from '$lib/components/shadcn/switch/index.js';
  import { loadOpen, saveOpen } from '$lib/sidebars';
  import { getAppState } from '$lib/state.svelte';

  const app = getAppState();
  const legend = $derived(app.map.labels.legend);

  // Always on screen, whatever the sidebars are doing; it can shrink to a chip
  // when it is in the way, and remembers that.
  let expanded = $state(true);
  onMount(() => (expanded = loadOpen('legend')));
  function setExpanded(value: boolean) {
    expanded = value;
    saveOpen('legend', value);
  }

  const card =
    'pointer-events-auto border border-rule-soft bg-[color-mix(in_srgb,var(--paper-2)_88%,transparent)] backdrop-blur-[6px]';
</script>

{#if expanded}
  <section
    class="{card} rounded-[14px] grid gap-1.5 px-3 pt-2.5 pb-3 type-small whitespace-nowrap text-ink-2"
    aria-label={legend.heading}
  >
    <header class="flex items-center justify-between gap-3">
      <h2 class="type-heading m-0 text-ink-2">{legend.heading}</h2>
      <button
        class="grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-ink-2 hover:bg-route-soft hover:text-ink"
        aria-label={legend.hide}
        title={legend.hide}
        onclick={() => setExpanded(false)}><MinusIcon size={14} /></button
      >
    </header>
    <div class="flex items-center gap-2.5">
      <svg width="16" height="16" class="flex-none overflow-visible"
        ><circle cx="8" cy="8" r="6" fill="var(--ink-2)" /></svg
      >
      <span>{legend.path}</span>
    </div>
    <div class="flex items-center gap-2.5">
      <svg width="16" height="16" class="flex-none overflow-visible"
        ><circle cx="8" cy="8" r="4.5" fill="var(--paper)" stroke="var(--muted)" stroke-width="1.5" /></svg
      >
      <span>{legend.alternative}</span>
    </div>
    <div class="flex items-center gap-2.5">
      <svg width="16" height="16" class="flex-none overflow-visible"
        ><circle cx="8" cy="8" r="3.5" fill="var(--muted)" /></svg
      >
      <span>{legend.context}</span>
    </div>
    <div class="flex items-center gap-2.5">
      <svg width="16" height="16" class="flex-none overflow-visible"
        ><line
          x1="1"
          y1="8"
          x2="15"
          y2="8"
          stroke="var(--route)"
          stroke-width="3"
          stroke-linecap="round"
        /></svg
      >
      <span>{legend.route}</span>
    </div>

    <label class="mt-1.5 flex cursor-pointer items-center gap-2.5 border-t border-rule-soft pt-2 text-ink">
      <Switch checked={app.showAll} onCheckedChange={() => app.toggleShowAll()} />
      <span>{legend.showAll}</span>
    </label>
  </section>
{:else}
  <button
    class="{card} flex h-[34px] cursor-pointer items-center rounded-full px-3.5 type-small text-ink-2 hover:text-ink"
    aria-label={legend.show}
    aria-expanded="false"
    onclick={() => setExpanded(true)}>{legend.heading}</button
  >
{/if}
