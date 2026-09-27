<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { getAppState } from '$lib/state.svelte';
  import { fill } from '$lib/text';
  import BigPicture from '../goal/BigPicture.svelte';
  import Disclosure from '../ui/Disclosure.svelte';
  import Markup from '../ui/Markup.svelte';
  import ModuleChip from '../ui/ModuleChip.svelte';
  import NodeChip from '../ui/NodeChip.svelte';
  import PanelHeader from '../ui/PanelHeader.svelte';
  import AgentHere from '../agent/AgentHere.svelte';
  import PanelSection from '../ui/PanelSection.svelte';
  import RefsSection from '../ui/RefsSection.svelte';
  import type { DerivedModule } from '$core/model';

  // One part of the goal, answering what a learner wants to know about it:
  // why it exists, where it sits and how it connects, what it gives you, where
  // on the journey you build it, and what it is made of on the map.
  let { module }: { module: DerivedModule } = $props();

  const app = getAppState();
  const labels = $derived(app.map.labels);

  const number = $derived(app.modulesInOrder.indexOf(module) + 1);
  const state = $derived(app.moduleState(module));

  // The stages that build it: usually one, sometimes a run (Ingest → Ground).
  const stages = $derived(
    app.map.stages.filter(
      (s) => s.order >= (module.startOrder ?? module.stageOrder ?? 0) && s.order <= (module.stageOrder ?? 0),
    ),
  );

  const verbTo = (from: DerivedModule, to: string) =>
    from.relations?.find((r) => r.to === to)?.verb ?? labels.bigPicture.buildsOn;
  const outgoing = $derived(module.dependsOn.map((id) => ({ id, verb: verbTo(module, id) })));
  const incoming = $derived(
    module.neededBy.map((id) => ({ id, verb: verbTo(app.map.moduleById[id], module.id) })),
  );

  // What it is made of, by region of the map, in the map's own order.
  const regions = $derived(
    [...app.map.domains]
      .sort((a, b) => a.order - b.order)
      .map((d) => ({ domain: d, ids: module.builtFrom.filter((id) => app.map.byId[id].domain === d.id) }))
      .filter((r) => r.ids.length),
  );

  function openStage(order: number) {
    app.goto(order);
    app.setPhase('brief');
  }
</script>

<PanelHeader title={module.title}>
  {#snippet nav()}
    <button
      class="back type-small cursor-pointer border-0 bg-transparent p-0 text-ink-2 hover:text-ink"
      onclick={() => app.selectModule(null)}
    >
      {fill(labels.goal.back, { stage: app.stage })}
    </button>
  {/snippet}
  {#snippet context()}
    {fill(labels.goal.partNumber, {
      n: number,
      total: app.map.modules.length,
      goal: app.map.goal?.title ?? '',
    })}{#if module.optional}&nbsp;· {labels.goal.optional}{/if}
  {/snippet}
  {#snippet chips()}
    <!-- Where on the journey it is built: one stage, or a run of them. -->
    {#each stages as stage, i (stage.id)}
      {#if i > 0}<span class="text-ink-2" aria-hidden="true">→</span>{/if}
      <button
        class="type-small inline-flex cursor-pointer items-center gap-2 rounded-full border py-0.5 pr-3 pl-1 {stage.order ===
        app.stage
          ? 'border-route bg-route-soft text-route'
          : 'border-rule-soft text-ink hover:border-ink-2'}"
        onclick={() => openStage(stage.order)}
      >
        <span
          class="type-meta grid size-5 place-items-center rounded-full font-semibold tabular-nums {stage.order <=
          app.stage
            ? 'bg-route text-paper'
            : 'border border-dashed border-muted text-muted'}">{stage.order}</span
        >
        {stage.title}
      </button>
    {/each}
  {/snippet}
</PanelHeader>

<p class="type-lead m-0"><Markup text={module.purpose} /></p>
<AgentHere anchor={{ kind: 'module', id: module.id }} title={module.title} />

{#if app.map.goal}
  <!-- Its place in the whole, as it stands now. -->
  <div class="mt-6"><BigPicture focus={module.id} /></div>
{/if}

{#if outgoing.length || incoming.length}
  <!-- The links in the picture, said in words. -->
  <div class="mt-3 grid gap-2">
    {#each outgoing as rel (rel.id)}
      <p class="m-0 flex flex-wrap items-center gap-2">
        <span class="type-small font-serif text-ink-2 italic">{rel.verb}</span>
        <ModuleChip id={rel.id} />
      </p>
    {/each}
    {#each incoming as rel (rel.id)}
      <p class="m-0 flex flex-wrap items-center gap-2">
        <ModuleChip id={rel.id} />
        <span class="type-small font-serif text-ink-2 italic"
          >{fill(labels.goal.itsVerb, { verb: rel.verb })}</span
        >
      </p>
    {/each}
  </div>
{/if}

<!-- What exists once it is built, ticked off as the journey builds it. -->
<PanelSection heading={labels.goal.produces}>
  <ul class="m-0 grid list-none gap-2 p-0">
    {#each module.produces as produced, i (i)}
      <li class="type-small flex items-start gap-3">
        <span
          class="mt-px grid size-4.5 flex-none place-items-center rounded-full {state === 'done'
            ? 'bg-route text-paper'
            : state === 'current'
              ? 'border-[1.5px] border-route bg-route-soft'
              : 'border-[1.5px] border-dashed border-muted'}"
        >
          {#if state === 'done'}<CheckIcon size={11} strokeWidth={3} />{/if}
        </span>
        <span class={state === 'ahead' ? 'text-ink-2' : 'text-ink'}><Markup text={produced} /></span>
      </li>
    {/each}
  </ul>
</PanelSection>

<!-- What it is made of on the map, by region. -->
<PanelSection heading={labels.goal.builtFrom}>
  <div class="grid gap-3">
    {#each regions as region (region.domain.id)}
      <div>
        <p class="type-meta m-0 mb-1 text-ink-2">{region.domain.label}</p>
        <div class="flex flex-wrap gap-2">
          {#each region.ids as id (id)}<NodeChip {id} />{/each}
        </div>
      </div>
    {/each}
  </div>
</PanelSection>

{#if module.refs?.length}
  <div class="mt-6">
    <Disclosure label={labels.refs.heading} count={module.refs.length}>
      <RefsSection refs={module.refs} bare />
    </Disclosure>
  </div>
{/if}
