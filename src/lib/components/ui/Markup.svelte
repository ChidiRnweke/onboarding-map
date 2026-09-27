<script lang="ts">
  import { parseInlineCode } from '$lib/text';

  let { text }: { text: string } = $props();

  const segments = $derived(parseInlineCode(text));
</script>

<!-- Code may break anywhere: a URL or a path has no spaces to wrap at, and
     would otherwise push the panel into scrolling sideways. -->
{#each segments as segment, i (i)}{#if segment.code}<code
      class="rounded bg-route-soft px-1 py-px text-[0.9em] [overflow-wrap:anywhere]">{segment.text}</code
    >{:else}{segment.text}{/if}{/each}
