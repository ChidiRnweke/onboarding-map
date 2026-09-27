<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import type { Ref } from '$core/model';

  // `bare` leaves the heading out, for when the list sits under one already.
  let { refs, bare = false }: { refs?: Ref[]; bare?: boolean } = $props();

  const app = getAppState();
  const labels = $derived(app.map.labels);
  const docById = $derived(Object.fromEntries((app.map.documents ?? []).map((d) => [d.id, d])));

  const items = $derived(
    (refs ?? []).map((ref) => {
      const doc = docById[ref.doc];
      const where = ref.slides?.length
        ? `${ref.slides.length > 1 ? labels.refs.slides : labels.refs.slide} ${ref.slides.join(', ')}`
        : '';
      const pending = doc.url === 'TODO';
      return {
        doc,
        pending,
        sub: [where, pending ? labels.refs.noLink : ''].filter(Boolean).join(' · '),
      };
    }),
  );
</script>

{#if items.length}
  <section>
    {#if !bare}
      <h3 class="type-heading m-0 mb-3 text-ink">
        {labels.refs.heading}
      </h3>
    {/if}
    <ul class="m-0 grid list-none gap-2 p-0">
      {#each items as item (item.doc.id)}
        <li class="type-small">
          <span class="block no-underline" class:text-ink-2={item.pending}>
            {#if item.pending}
              <span>{item.doc.title}</span>
            {:else}
              <a class="group" href={item.doc.url} target="_blank" rel="noopener">
                <span class="underline decoration-rule underline-offset-[3px] group-hover:decoration-current"
                  >{item.doc.title}</span
                >
              </a>
            {/if}
            <span class="type-meta block text-ink-2">{item.sub}</span>
          </span>
        </li>
      {/each}
    </ul>
  </section>
{/if}
