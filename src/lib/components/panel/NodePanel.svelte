<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';
  import { fill, splitLead } from '$lib/text';
  import DocLink from '../ui/DocLink.svelte';
  import Disclosure from '../ui/Disclosure.svelte';
  import Markup from '../ui/Markup.svelte';
  import ModuleRef from '../ui/ModuleRef.svelte';
  import NodeChip from '../ui/NodeChip.svelte';
  import PanelHeader from '../ui/PanelHeader.svelte';
  import PanelSection from '../ui/PanelSection.svelte';
  import RefsSection from '../ui/RefsSection.svelte';
  import Template from '../ui/Template.svelte';
  import type { DerivedNode } from '$core/model';

  // One concept: what it is (a lead sentence, then the detail), where it fits
  // in the big picture, its neighbourhood as the map would show it, and one
  // way to read further. Opened from Read, it is a stop on a tour through the
  // stage's reading, with the next stop one click away.
  let { node }: { node: DerivedNode } = $props();

  const app = getAppState();
  const theme = getTheme();
  const labels = $derived(app.map.labels);

  const domain = $derived(app.map.domains.find((d) => d.id === node.domain)!);
  const parent = $derived(node.parent ? app.map.byId[node.parent] : null);
  const stage = $derived(app.map.stages.find((s) => s.order === node.stageOrder));
  const partOf = $derived(app.map.nodeModules[node.id] ?? []);
  // The dataset's kind; a category is a grouping and has none.
  const kind = $derived(app.map.kinds.find((k) => k.id === node.kind));
  // Where it stands on the journey. A group has no place of its own; its items do.
  const standing = $derived(
    !kind
      ? null
      : node.status === 'path' && stage
        ? 'route'
        : node.status === 'alternative' && node.alternativeTo
          ? 'alternative'
          : 'context',
  );
  const summary = $derived(splitLead(node.summary));
  const docs = $derived(node.docs ?? []);
  const tour = $derived(app.readingTour);

  const verb = (kind: string, label?: string) => label || kind.replace(/-/g, ' ');

  // Relations grouped by what they say, so "provisions" is written once with
  // everything provisioned after it.
  function group(edges: { verb: string; id: string }[]) {
    const out: { verb: string; ids: string[] }[] = [];
    for (const e of edges) {
      const row = out.find((r) => r.verb === e.verb);
      if (row) row.ids.push(e.id);
      else out.push({ verb: e.verb, ids: [e.id] });
    }
    return out;
  }
  const outgoing = $derived(
    group(
      app.map.edges.filter((e) => e.from === node.id).map((e) => ({ verb: verb(e.kind, e.label), id: e.to })),
    ),
  );
  const incoming = $derived(
    group(
      app.map.edges.filter((e) => e.to === node.id).map((e) => ({ verb: verb(e.kind, e.label), id: e.from })),
    ),
  );
  const alternatives = $derived(app.map.nodes.filter((n) => n.alternativeTo === node.id).map((n) => n.id));

  const chip = 'type-small inline-flex items-center gap-1 rounded-full px-3 py-1';
  const verb_ = 'type-small font-serif text-ink-2 italic';
</script>

<PanelHeader title={node.label}>
  {#snippet nav()}
    {#if tour}
      <!-- A stop on the stage's reading tour: what you are reading for, and how far. -->
      <button
        class="back type-small min-w-0 cursor-pointer truncate border-0 bg-transparent p-0 text-left text-ink-2 hover:text-ink"
        onclick={() => app.select(null)}
      >
        {fill(labels.node.backToRead, { n: app.currentStage.order, stage: app.currentStage.title })}
      </button>
      <span class="ml-auto flex flex-none items-center gap-1 max-md:hidden" aria-hidden="true">
        {#each tour.list as id, i (id)}
          <span
            class="h-1.5 rounded-full transition-[width] {i === tour.index
              ? 'w-4 bg-route'
              : app.stageProgress.read.includes(id)
                ? 'w-1.5 bg-route'
                : 'w-1.5 bg-rule'}"
          ></span>
        {/each}
      </span>
      <span class="type-meta ml-auto flex-none text-ink-2 tabular-nums md:ml-0">
        {fill(labels.node.readProgress, { n: tour.index + 1, total: tour.list.length })}
      </span>
    {:else}
      <button
        class="back type-small cursor-pointer border-0 bg-transparent p-0 text-ink-2 hover:text-ink"
        onclick={() => app.select(null)}
      >
        {fill(labels.node.back, { stage: app.stage })}
      </button>
    {/if}
  {/snippet}

  {#snippet context()}
    <!-- Where it lives on the map: its region, then the group inside it.
         Both open: the region's overview, the group as a concept. -->
    <button
      class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rule-soft bg-transparent py-0.5 pr-2 pl-1.5 text-ink-2 hover:border-ink-2 hover:text-ink"
      onclick={() => app.selectRegion(node.domain)}
    >
      <span class="size-2 rounded-full" style="background:{theme.tone(node.domain)}"></span>{domain.label}
    </button>
    {#if parent}
      <!-- The chevron wraps with the group it leads to, never on its own. -->
      <span class="inline-flex items-center gap-1">
        <ChevronRightIcon size={12} class="flex-none text-muted" /><button
          class="cursor-pointer border-0 bg-transparent p-0 text-ink-2 underline decoration-rule underline-offset-2 hover:text-ink hover:decoration-current"
          onclick={() => app.select(parent.id)}>{parent.label}</button
        >
      </span>
    {/if}
  {/snippet}

  {#snippet chips()}
    <!-- What it is, and where it stands on the journey. -->
    {#if kind}
      <button
        class="{chip} cursor-pointer border border-rule-soft bg-transparent text-ink-2 hover:border-ink-2 hover:text-ink"
        onclick={() => app.selectKind(kind.id)}>{kind.label}</button
      >
    {:else}
      <span class="{chip} border border-dashed border-rule-soft text-ink-2">{labels.node.group}</span>
    {/if}
    {#if standing === 'route' && stage}
      <button
        class="{chip} cursor-pointer border border-route bg-route-soft text-route hover:bg-route hover:text-paper"
        onclick={() => {
          app.goto(stage.order);
          app.setPhase('brief');
        }}
      >
        <Template text={labels.node.onRoute}>
          {#snippet slot()}<strong class="font-semibold"
              >{fill(labels.node.onRouteStage, { stageNumber: stage.order, stageTitle: stage.title })}</strong
            >{/snippet}
        </Template>
      </button>
    {:else if standing === 'alternative'}
      <span class="{chip} border border-dashed border-muted text-ink-2">
        <Template text={labels.node.alternativeTo}>
          {#snippet slot()}<strong class="font-semibold text-ink"
              >{app.map.byId[node.alternativeTo!].label}</strong
            >{/snippet}
        </Template>
      </span>
    {:else if standing === 'context'}
      <span class="{chip} border border-dashed border-rule text-ink-2">{labels.node.context}</span>
    {/if}
    {#if (node.tags ?? []).includes('proposed')}
      <span class="{chip} border border-rule text-ink-2">{labels.node.proposed}</span>
    {/if}
  {/snippet}
</PanelHeader>

<!-- The first sentence leads; the rest is the detail under it. -->
<p class="type-lead m-0"><Markup text={summary.lead} /></p>
{#if summary.rest}
  <p class="type-body m-0 mt-3 text-ink-2"><Markup text={summary.rest} /></p>
{/if}

{#if partOf.length}
  <!-- Where this sits in the big picture: the part of the goal it belongs to,
       and why the goal needs that part. -->
  <div class="type-small mt-6 rounded-xl bg-route-soft px-4 py-3">
    <p class="m-0 text-ink">
      <Template text={labels.goal.partOf}>
        {#snippet slot()}{#each partOf as id, i (id)}{i > 0 ? ', ' : ''}<ModuleRef {id} />{/each}{/snippet}
      </Template>
    </p>
    <p class="m-0 mt-1 text-ink-2"><Markup text={app.map.moduleById[partOf[0]].purpose} /></p>
  </div>
{/if}

{#if (node.variants ?? []).length}
  <div class="mt-6 grid gap-3">
    {#each node.variants! as variant (variant.label)}
      <div class="rounded-xl border border-rule-soft bg-paper px-4 py-3">
        <h3 class="type-heading m-0 mb-1 text-ink-2">{variant.label}</h3>
        <p class="type-small m-0"><Markup text={variant.summary} /></p>
        {#if (variant.docs ?? []).length}
          <ul class="m-0 mt-2 list-none p-0">
            {#each variant.docs! as doc (doc.url + doc.title)}<li><DocLink {doc} /></li>{/each}
          </ul>
        {/if}
      </div>
    {/each}
  </div>
{/if}

{#if node.children.length}
  <!-- A group: what is in it. -->
  <PanelSection heading={labels.node.inGroup}>
    <div class="flex flex-wrap gap-2">
      {#each node.children as id (id)}<NodeChip {id} />{/each}
    </div>
  </PanelSection>
{/if}

{#if outgoing.length || incoming.length || alternatives.length}
  <!-- The neighbourhood, one row per kind of relation, read as a sentence:
       "uses → Providers", "GitHub Copilot → researches through it". -->
  <PanelSection heading={labels.node.connections}>
    <div class="grid gap-2">
      {#each outgoing as row (row.verb)}
        <p class="m-0 flex flex-wrap items-center gap-2">
          <span class={verb_}>{row.verb}</span>
          {#each row.ids as id (id)}<NodeChip {id} />{/each}
        </p>
      {/each}
      {#each incoming as row (row.verb)}
        <p class="m-0 flex flex-wrap items-center gap-2">
          {#each row.ids as id (id)}<NodeChip {id} />{/each}
          <span class={verb_}>{row.verb} {labels.node.incomingSuffix}</span>
        </p>
      {/each}
      {#if alternatives.length}
        <p class="m-0 flex flex-wrap items-center gap-2">
          <span class={verb_}>{labels.node.alternatives.toLowerCase()}</span>
          {#each alternatives as id (id)}<NodeChip {id} />{/each}
        </p>
      {/if}
    </div>
  </PanelSection>
{/if}

{#if docs.length}
  <!-- One way to read further, prominent; the others one click away. -->
  {@const first = docs[0]}
  <div class="mt-8">
    {#if first.url === 'TODO'}
      <div class="rounded-xl border border-dashed border-rule px-4 py-3 text-ink-2">
        <span class="type-body block">{first.title}</span>
        <span class="type-meta block">{labels.node.pendingLink}</span>
      </div>
    {:else}
      <a
        class="group flex items-center gap-3 rounded-xl border border-rule-soft bg-paper px-4 py-3 no-underline hover:border-route"
        href={first.url}
        target="_blank"
        rel="noopener"
      >
        <span class="min-w-0 flex-1">
          <span class="type-body block font-[600] text-ink">{first.title}</span>
          <span class="type-meta block text-ink-2">{labels.sources[first.source] ?? first.source}</span>
        </span>
        <ArrowUpRightIcon size={18} class="flex-none text-ink-2 group-hover:text-route" />
      </a>
    {/if}
    {#if docs.length > 1}
      <div class="mt-3">
        <Disclosure label={labels.node.moreDocs} count={docs.length - 1}>
          <ul class="m-0 grid list-none gap-2 p-0">
            {#each docs.slice(1) as doc (doc.url + doc.title)}<li><DocLink {doc} /></li>{/each}
          </ul>
        </Disclosure>
      </div>
    {/if}
  </div>
{/if}

{#if node.refs?.length}
  <div class="mt-6">
    <Disclosure label={labels.refs.heading} count={node.refs.length}>
      <RefsSection refs={node.refs} bare />
    </Disclosure>
  </div>
{/if}

{#if tour}
  <button
    class="type-body mt-8 w-full cursor-pointer rounded-full border border-route bg-route px-4 py-2.5 text-paper"
    onclick={() => app.nextRead()}
  >
    {#if tour.next}
      {fill(labels.node.nextRead, { node: app.map.byId[tour.next].label })} →
    {:else}
      {fill(labels.phases.continueTo, { phase: labels.phases.done })} →
    {/if}
  </button>
{/if}
