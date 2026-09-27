<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { getAppState } from '$lib/state.svelte';
  import { fill } from '$lib/text';
  import type { Stage } from '$core/model';

  const app = getAppState();
  const labels = $derived(app.map.labels);

  // Stages grouped by the period they belong to (day, week, module…).
  const periods = $derived.by(() => {
    // Built fresh on each recompute and never mutated afterwards, so the
    // reactive SvelteMap would add overhead for no benefit.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const groups = new Map<number, Stage[]>();
    for (const stage of app.map.stages) {
      const group = groups.get(stage.period);
      if (group) group.push(stage);
      else groups.set(stage.period, [stage]);
    }
    return [...groups];
  });

  const statusOf = (stage: Stage) =>
    stage.order < app.stage ? 'done' : stage.order === app.stage ? 'current' : 'ahead';

  // The numbered disc. Its colours follow the stage's position in the journey.
  function disc(status: string) {
    const base =
      'n grid h-[24px] w-[24px] flex-none place-items-center rounded-full border-[1.5px] type-meta leading-none font-semibold tabular-nums';
    if (status === 'ahead') return `${base} border-dashed border-muted text-muted`;
    if (status === 'done') return `${base} border-route bg-route text-paper`;
    // current: filled, with a soft ring around it
    return `${base} border-route bg-route text-paper shadow-[0_0_0_4px_var(--route-soft)]`;
  }

  // Same rule as button(): display is set once per state. The title is hidden
  // once the column is narrow, except on the current stage, which keeps it.
  function title(status: string) {
    if (status === 'current')
      return 't font-semibold @max-[1400px]:inline @max-[1400px]:pr-2 max-[860px]:inline max-[860px]:pr-2';
    return 't @max-[1400px]:hidden max-[860px]:hidden';
  }

  function button(status: string) {
    // Every conflicting property is set exactly once. Listing border-rule in a
    // shared base and border-route in a variant would not work: both are
    // border-color utilities, and Tailwind decides the winner by its own output
    // order, not by the order they appear in the class attribute.
    const base =
      'stage-btn flex cursor-pointer items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 type-small transition-[border-color,background] duration-200 @max-[1400px]:p-1 max-[860px]:p-1';
    // Inside the day card, so no fill of their own: the card is the region.
    const bg = 'bg-transparent';

    // The hover colour belongs to the non-current states only. The stylesheet
    // got that from source order - .stage-btn:hover sat before .stage-btn.current
    // at equal specificity - but Tailwind sorts hover after the base utility, so
    // a shared hover:border-ink-2 would grey out the current stage on hover.
    if (status === 'current') return `${base} current border-route bg-route-soft`;
    if (status === 'ahead') return `${base} ahead border-transparent hover:border-rule ${bg} text-ink-2`;
    return `${base} done border-transparent hover:border-rule ${bg}`;
  }
</script>

<!-- Days are grouped by common region and proximity: each day is one enclosed
     card, stages sit tight inside it, and days sit well apart. The day's name
     opens what it gives you. -->
<nav
  class="journey pointer-events-none flex w-full flex-wrap items-end gap-6 @max-[1400px]:flex-nowrap @max-[1400px]:gap-4 max-[860px]:flex-nowrap max-[860px]:gap-3! max-[860px]:overflow-x-auto"
  aria-label={labels.aria.stages}
>
  {#each periods as [period, stages] (period)}
    {@const here = stages.some((s) => s.order === app.stage)}
    {@const named = app.map.periods?.find((p) => p.period === period)}
    <div
      class="pointer-events-auto grid flex-none gap-0.5 rounded-[18px] border bg-[color-mix(in_srgb,var(--paper-2)_88%,transparent)] px-1 pt-0.5 pb-1 backdrop-blur-[6px] {here
        ? 'border-route-soft'
        : 'border-rule-soft'} {app.period === period ? 'ring-2 ring-route' : ''}"
    >
      <button
        class="day-label flex cursor-pointer items-center gap-1 border-0 bg-transparent px-2 pt-0.5 text-left type-body font-serif text-ink-2 italic hover:text-ink max-[860px]:type-small"
        title={fill(labels.periodOverview.open, { period: labels.period, n: period })}
        aria-label={fill(labels.periodOverview.open, { period: labels.period, n: period })}
        aria-expanded={app.period === period}
        onclick={() => app.selectPeriod(app.period === period ? null : period)}
      >
        {labels.period}
        {period}{#if named}<span class="truncate not-italic @max-[1400px]:hidden max-[860px]:hidden"
            >&nbsp;· {named.title}</span
          >{/if}
        <ChevronRightIcon size={13} class="flex-none" />
      </button>
      <div class="flex gap-1">
        {#each stages as stage (stage.id)}
          {@const status = statusOf(stage)}
          <button
            class={button(status)}
            title="{stage.title}: {stage.feeling}"
            aria-label={stage.title}
            aria-current={stage.order === app.stage ? 'step' : 'false'}
            onclick={() => app.goto(stage.order)}
          >
            <span class={disc(status)}>{stage.order}</span><span class={title(status)}>{stage.title}</span>
          </button>
        {/each}
      </div>
    </div>
  {/each}
</nav>
