<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import type { DocLink, DerivedNode } from '$core/model';

  // When `node` is given the link is titled by the node and subtitled by the
  // document; otherwise by the document and its source.
  let { doc, node }: { doc: DocLink; node?: DerivedNode } = $props();

  const app = getAppState();
  const labels = $derived(app.map.labels);
  const sourceName = $derived(labels.sources[doc.source] ?? doc.source);
</script>

{#if doc.url === 'TODO'}
  <span class="type-small block text-ink-2 no-underline">
    <span>{doc.title}</span>
    <span class="type-meta block text-ink-2">{labels.node.pendingLink}</span>
  </span>
{:else}
  <a class="group type-small block no-underline" href={doc.url} target="_blank" rel="noopener">
    <span class="underline decoration-rule underline-offset-[3px] group-hover:decoration-current"
      >{node ? node.label : doc.title}</span
    >
    <span class="type-meta block text-ink-2">{node ? doc.title : sourceName}</span>
  </a>
{/if}
