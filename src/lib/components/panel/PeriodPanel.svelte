<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import { fill } from '$lib/text';
  import BigPicture from '../goal/BigPicture.svelte';
  import Markup from '../ui/Markup.svelte';
  import ModuleRef from '../ui/ModuleRef.svelte';
  import PanelHeader from '../ui/PanelHeader.svelte';
  import PanelSection from '../ui/PanelSection.svelte';

  // What a day (or week…) gives you: its stages, each a verb, with what it
  // leaves behind, and the big picture as it stands once the day is over.
  let { period }: { period: number } = $props();

  const app = getAppState();
  const labels = $derived(app.map.labels);
  const named = $derived(app.map.periods?.find((p) => p.period === period));
  const stages = $derived(app.stagesOf(period));
  const last = $derived(stages[stages.length - 1]);
  const parts = $derived(
    stages
      .flatMap((s) => [...(s.delivers ?? []), ...(s.contributes ?? [])])
      .filter((id, i, all) => all.indexOf(id) === i),
  );
  const vars = $derived({ period: labels.period, n: period });
  const periodCount = $derived(new Set(app.map.stages.map((s) => s.period)).size);

  function start() {
    app.goto(stages[0].order);
    app.setPhase('brief');
  }
</script>

<PanelHeader title={named?.title ?? `${labels.period} ${period}`}>
  {#snippet nav()}
    <button
      class="back type-small cursor-pointer border-0 bg-transparent p-0 text-ink-2 hover:text-ink"
      onclick={() => app.selectPeriod(null)}
    >
      {fill(labels.node.back, { stage: app.stage })}
    </button>
  {/snippet}
  {#snippet context()}{fill(labels.periodOverview.position, { ...vars, total: periodCount })}{/snippet}
</PanelHeader>

{#if named?.summary}
  <p class="type-lead m-0 mb-6"><Markup text={named.summary} /></p>
{/if}

<ol class="m-0 grid list-none gap-6 p-0">
  {#each stages as stage (stage.id)}
    {@const part = app.moduleOf(stage)}
    <li class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
      <span
        class="type-meta mt-0.5 grid size-6 place-items-center rounded-full border-[1.5px] font-semibold tabular-nums {stage.order <
        app.stage
          ? 'border-route bg-route text-paper'
          : stage.order === app.stage
            ? 'border-route bg-route-soft text-route'
            : 'border-dashed border-muted text-muted'}">{stage.order}</span
      >
      <div>
        <button
          class="type-body cursor-pointer border-0 bg-transparent p-0 text-left font-[650] text-ink underline decoration-rule underline-offset-[3px] hover:decoration-current"
          onclick={() => {
            app.goto(stage.order);
            app.setPhase('brief');
          }}>{stage.title}</button
        >
        <p class="type-small m-0 font-serif text-route italic">“{stage.feeling}”</p>
        {#if part}
          <p class="type-small m-0 mt-2 text-ink-2">
            {labels.periodOverview.gives}
            <ModuleRef id={part.id} />
          </p>
          <!-- What exists once the part is finished; a stage that only works
               toward a part leaves this to the stage that completes it. -->
          {#if stage.delivers?.length}
            <ul class="m-0 mt-1 grid list-none gap-1 p-0">
              {#each part.produces as produced, i (i)}
                <li
                  class="type-small relative pl-4 text-ink-2 before:absolute before:top-[0.62em] before:left-0.5 before:h-[1.5px] before:w-1.5 before:bg-muted before:content-['']"
                >
                  <Markup text={produced} />
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </div>
    </li>
  {/each}
</ol>

{#if app.map.goal}
  <PanelSection heading={fill(labels.periodOverview.endOf, vars)}>
    <!-- Drawn as it stands once the last stage of the period is done. -->
    <BigPicture at={last.order + 1} focus={parts} />
  </PanelSection>
{/if}

<button
  class="type-body mt-8 w-full cursor-pointer rounded-full border border-route bg-route px-4 py-2.5 text-paper"
  onclick={start}>{fill(labels.periodOverview.start, vars)}</button
>
