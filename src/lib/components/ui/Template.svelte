<script lang="ts">
  import { parseTemplate } from '$lib/text';
  import type { Snippet } from 'svelte';

  // Renders a label such as "An alternative to {node}", handing each
  // {placeholder} to a snippet so an element can stand in its place.
  let { text, slot }: { text: string; slot: Snippet<[string]> } = $props();

  const parts = $derived(parseTemplate(text));
</script>

{#each parts as part, i (i)}{#if part.kind === 'text'}{part.value}{:else}{@render slot(part.name)}{/if}{/each}
