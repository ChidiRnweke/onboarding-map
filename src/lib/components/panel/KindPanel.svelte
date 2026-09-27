<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';
  import { fill } from '$lib/text';
  import Disclosure from '../ui/Disclosure.svelte';
  import Markup from '../ui/Markup.svelte';
  import NodeChip from '../ui/NodeChip.svelte';
  import PanelHeader from '../ui/PanelHeader.svelte';
  import PanelSection from '../ui/PanelSection.svelte';

  // One kind of thing on the map, as the dataset defines it: what counts as
  // one here, the ones on your route (outlined on the map), and the rest by
  // region, one click away.
  let { id }: { id: string } = $props();

  const app = getAppState();
  const theme = getTheme();
  const labels = $derived(app.map.labels);
  const kind = $derived(app.map.kinds.find((k) => k.id === id)!);

  const all = $derived(app.map.nodes.filter((n) => n.kind === id));
  const onRoute = $derived(
    all.filter((n) => n.status === 'path').sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0)),
  );
  const elsewhere = $derived(
    [...app.map.domains]
      .sort((a, b) => a.order - b.order)
      .map((domain) => ({
        domain,
        ids: all.filter((n) => n.status !== 'path' && n.domain === domain.id).map((n) => n.id),
      }))
      .filter((g) => g.ids.length),
  );
  const elsewhereCount = $derived(all.length - onRoute.length);
</script>

<PanelHeader title={kind.plural}>
  {#snippet nav()}
    <button
      class="back type-small cursor-pointer border-0 bg-transparent p-0 text-ink-2 hover:text-ink"
      onclick={() => app.selectKind(null)}
    >
      {fill(labels.node.back, { stage: app.stage })}
    </button>
  {/snippet}
  {#snippet context()}{labels.kind.context}{/snippet}
  {#snippet chips()}
    <span class="type-small inline-flex rounded-full border border-route bg-route-soft px-3 py-1 text-route"
      >{fill(labels.kind.count, { n: onRoute.length, total: all.length })}</span
    >
  {/snippet}
</PanelHeader>

<p class="type-lead m-0"><Markup text={kind.description} /></p>

{#if onRoute.length}
  <PanelSection heading={labels.kind.onRoute}>
    <div class="flex flex-wrap gap-2">
      {#each onRoute as node (node.id)}<NodeChip id={node.id} />{/each}
    </div>
  </PanelSection>
{/if}

{#if elsewhere.length}
  <div class="mt-8">
    <Disclosure label={labels.kind.elsewhere} count={elsewhereCount}>
      <div class="grid gap-6">
        {#each elsewhere as { domain, ids } (domain.id)}
          <div>
            <button
              class="type-small mb-2 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-[650] text-ink hover:underline"
              onclick={() => app.selectRegion(domain.id)}
            >
              <span class="size-2 rounded-full" style="background:{theme.tone(domain.id)}"
              ></span>{domain.label}
            </button>
            <div class="flex flex-wrap gap-2">
              {#each ids as nodeId (nodeId)}<NodeChip id={nodeId} />{/each}
            </div>
          </div>
        {/each}
      </div>
    </Disclosure>
  </div>
{/if}
