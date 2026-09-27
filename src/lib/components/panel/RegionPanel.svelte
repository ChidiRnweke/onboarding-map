<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';
  import { fill } from '$lib/text';
  import Markup from '../ui/Markup.svelte';
  import ModuleChip from '../ui/ModuleChip.svelte';
  import NodeChip from '../ui/NodeChip.svelte';
  import PanelHeader from '../ui/PanelHeader.svelte';
  import PanelSection from '../ui/PanelSection.svelte';

  // One region of the map, opened from its name on the rim or from a
  // concept's breadcrumb: what it is about, what of it the route visits and
  // when, which goal parts are made from it, and what it holds, group by group.
  let { id }: { id: string } = $props();

  const app = getAppState();
  const theme = getTheme();
  const labels = $derived(app.map.labels);
  const domain = $derived(app.map.domains.find((d) => d.id === id)!);

  const items = $derived(app.map.nodes.filter((n) => n.domain === id && n.kind !== 'category'));
  const onRoute = $derived(items.filter((n) => n.status === 'path'));

  // The route's items here, under the stage that visits them.
  const byStage = $derived(
    app.map.stages
      .map((stage) => ({ stage, ids: onRoute.filter((n) => n.stageOrder === stage.order).map((n) => n.id) }))
      .filter((g) => g.ids.length),
  );

  const parts = $derived(
    app.modulesInOrder.filter((m) => m.builtFrom.some((n) => app.map.byId[n]?.domain === id)),
  );

  // How the region breaks down by kind, as chips that open each kind.
  const kinds = $derived(
    app.map.kinds
      .map((kind) => ({ kind, n: items.filter((n) => n.kind === kind.id).length }))
      .filter((k) => k.n),
  );

  const groups = $derived(app.map.nodes.filter((n) => n.domain === id && n.kind === 'category'));
  /** Groups showing their items outside the focused view too. */
  const expanded = new SvelteSet<string>();

  function openStage(order: number) {
    app.goto(order);
    app.setPhase('brief');
  }

  const chip = 'type-small inline-flex items-center gap-1 rounded-full px-3 py-1';
</script>

<PanelHeader title={domain.label}>
  {#snippet nav()}
    <button
      class="back type-small cursor-pointer border-0 bg-transparent p-0 text-ink-2 hover:text-ink"
      onclick={() => app.selectRegion(null)}
    >
      {fill(labels.node.back, { stage: app.stage })}
    </button>
  {/snippet}
  {#snippet context()}
    <span class="size-2 rounded-full" style="background:{theme.tone(id)}"></span>{labels.region.context}
  {/snippet}
  {#snippet chips()}
    {#if onRoute.length}
      <span class="{chip} border border-route bg-route-soft text-route"
        >{fill(labels.region.onRoute, { n: onRoute.length })}</span
      >
    {/if}
    {#each kinds as { kind, n } (kind.id)}
      <button
        class="{chip} cursor-pointer border border-rule-soft bg-transparent text-ink-2 hover:border-ink-2 hover:text-ink"
        onclick={() => app.selectKind(kind.id)}
      >
        <span class="font-[650] text-ink tabular-nums">{n}</span>{n === 1 ? kind.label : kind.plural}
      </button>
    {/each}
  {/snippet}
</PanelHeader>

<p class="type-lead m-0"><Markup text={domain.tagline} /></p>
{#if domain.summary}
  <p class="type-body m-0 mt-3 text-ink-2"><Markup text={domain.summary} /></p>
{/if}

{#if byStage.length}
  <PanelSection heading={labels.region.route}>
    <div class="grid gap-3">
      {#each byStage as { stage, ids } (stage.id)}
        <div class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3">
          <button
            class="type-small mt-0.5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-rule-soft bg-transparent py-0.5 pr-3 pl-1 text-ink hover:border-ink-2"
            onclick={() => openStage(stage.order)}
          >
            <span
              class="type-meta grid size-5 place-items-center rounded-full font-semibold tabular-nums {stage.order <=
              app.stage
                ? 'bg-route text-paper'
                : 'border border-dashed border-muted text-muted'}">{stage.order}</span
            >{stage.title}
          </button>
          <div class="flex flex-wrap gap-2">
            {#each ids as nodeId (nodeId)}<NodeChip id={nodeId} />{/each}
          </div>
        </div>
      {/each}
    </div>
  </PanelSection>
{/if}

{#if parts.length}
  <PanelSection heading={labels.region.parts}>
    <div class="flex flex-wrap gap-2">
      {#each parts as part (part.id)}<ModuleChip id={part.id} />{/each}
    </div>
  </PanelSection>
{/if}

{#if groups.length}
  <PanelSection heading={labels.region.contents}>
    <div class="grid gap-6">
      {#each groups as group (group.id)}
        {@const shown = group.children.filter((c) => app.visible(app.map.byId[c]))}
        {@const hidden = group.children.filter((c) => !app.visible(app.map.byId[c]))}
        <div>
          <button
            class="type-small m-0 mb-2 cursor-pointer border-0 bg-transparent p-0 text-left font-[650] text-ink underline decoration-rule underline-offset-2 hover:decoration-current"
            onclick={() => app.select(group.id)}>{group.label}</button
          >
          <div class="flex flex-wrap gap-2">
            {#each expanded.has(group.id) ? group.children : shown as nodeId (nodeId)}<NodeChip
                id={nodeId}
              />{/each}
            {#if hidden.length && !expanded.has(group.id)}
              <!-- Items the focused view leaves out, one click away. -->
              <button
                class="{chip} cursor-pointer border border-dashed border-rule bg-transparent text-ink-2 hover:text-ink"
                onclick={() => expanded.add(group.id)}
                >{fill(labels.region.more, { n: hidden.length })}</button
              >
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </PanelSection>
{/if}
