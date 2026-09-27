<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import type { Snippet } from 'svelte';

  // Secondary material, one click away: a labelled toggle with a count, closed
  // until asked for.
  let {
    label,
    count,
    open = false,
    children,
  }: { label: string; count?: number; open?: boolean; children: Snippet } = $props();

  // svelte-ignore state_referenced_locally
  let expanded = $state(open);
</script>

<section>
  <button
    class="type-heading flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-ink-2 hover:text-ink"
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
  >
    {label}{#if count !== undefined}<span class="font-normal tabular-nums">({count})</span>{/if}
    <ChevronDownIcon size={15} class="transition-transform {expanded ? 'rotate-180' : ''}" />
  </button>
  {#if expanded}
    <div class="mt-3">{@render children()}</div>
  {/if}
</section>
