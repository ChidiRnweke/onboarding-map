<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { motion } from '$lib/motion';
  import { getAppState } from '$lib/state.svelte';
  import { fill } from '$lib/text';
  import BigPicture from '../goal/BigPicture.svelte';
  import StageBridge from '../goal/StageBridge.svelte';
  import Markup from '../ui/Markup.svelte';
  import PanelHeader from '../ui/PanelHeader.svelte';
  import StageDone from './StageDone.svelte';
  import StageRead from './StageRead.svelte';
  import StageSteps from './StageSteps.svelte';
  import type { Phase } from '$lib/progress';

  // A stage is walked through, not read top to bottom: it opens from the big
  // picture (the brief), goes through Do, Observe and Read one phase at a time,
  // and closes by stepping back to the big picture. The phase bar shows where
  // you are and lets you jump anywhere; nothing is locked.
  const app = getAppState();
  const labels = $derived(app.map.labels);
  const stage = $derived(app.currentStage);
  const part = $derived(app.moduleOf(stage));

  const where = $derived(
    fill(labels.stagePosition, {
      period: labels.period,
      periodNumber: stage.period,
      stage: stage.order,
      total: app.stageCount,
    }),
  );

  const nameOf = (phase: Phase) => labels.phases[phase];
  const nextPhase = $derived(app.phases[app.phases.indexOf(app.phase) + 1]);
  const count = $derived(app.itemCount(app.phase));
  const lastItem = $derived(count === 0 || app.step >= count - 1);

  // Do, Observe and Read keep their lead-in from the method: first, then, and only then.
  const method = $derived(
    app.phase === 'do' || app.phase === 'observe' || app.phase === 'read' ? labels.method[app.phase] : null,
  );

  function tab(phase: Phase) {
    const base = 'type-small cursor-pointer border-0 bg-transparent px-0.5 pt-1 pb-2 whitespace-nowrap';
    const index = app.phases.indexOf(phase);
    const here = app.phases.indexOf(app.phase);
    if (phase === app.phase) return `${base} font-[650] text-ink`;
    return `${base} ${index < here ? 'text-ink-2' : 'text-muted'} hover:text-ink`;
  }

  // Which way the learner moved, so the next phase comes in from that side:
  // forward from the right, back from the left. `last` is bookkeeping, not
  // state; it only remembers the phase the derived saw before.
  let last: string = `${app.stage}:${app.phases.indexOf(app.phase)}`;
  const direction = $derived.by(() => {
    const here = `${app.stage}:${app.phases.indexOf(app.phase)}`;
    const [s0, p0] = last.split(':').map(Number);
    const forward = app.stage > s0 || (app.stage === s0 && app.phases.indexOf(app.phase) >= p0);
    last = here;
    return forward ? 1 : -1;
  });

  // One underline that slides to the current tab, rather than one per tab
  // that jumps. Measured from the tab itself, so any label width works.
  const tabs: Record<string, HTMLButtonElement> = {};
  let nav = $state<HTMLElement | null>(null);
  let bar = $state({ left: 0, width: 0 });
  function place() {
    const el = tabs[app.phase];
    if (el) bar = { left: el.offsetLeft, width: el.offsetWidth };
  }
  $effect(() => {
    void app.phase;
    void app.step;
    void app.phases.length;
    place();
  });
  $effect(() => {
    if (!nav) return;
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => observer.disconnect();
  });

  const pager =
    'type-small cursor-pointer rounded-full px-4 py-2 disabled:cursor-default disabled:opacity-35';
</script>

<!-- Once the stage is under way the title steps back: the steps are the point. -->
<PanelHeader title={stage.title} compact={app.phase !== 'brief'}>
  {#snippet context()}{where}{/snippet}
</PanelHeader>

<!-- Sticks to the top of the panel as it scrolls; the negative margins let it
     run edge to edge through the panel's padding. -->
<nav
  bind:this={nav}
  class="sticky -top-6 z-[1] -mx-6 -mt-3 mb-6 flex gap-4 overflow-x-auto border-b border-rule-soft bg-panel px-6 pt-2 max-md:-top-4 max-md:-mx-4 max-md:px-4"
  aria-label={stage.title}
>
  <span
    data-tab-indicator
    class="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-route transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
    style="left:{bar.left}px; width:{bar.width}px"
    aria-hidden="true"
  ></span>
  {#each app.phases as phase (phase)}
    <button
      bind:this={tabs[phase]}
      class={tab(phase)}
      aria-current={phase === app.phase ? 'step' : undefined}
      onclick={() => app.setPhase(phase)}
    >
      {nameOf(phase)}{#if app.itemCount(phase) && phase === app.phase}<span
          class="ml-1 font-normal text-ink-2 tabular-nums">{app.step + 1}/{app.itemCount(phase)}</span
        >{/if}
    </button>
  {/each}
</nav>

<!-- Each phase slides in from the side the learner moved towards. There is no
     way out: the old phase goes at once, so the panel never holds two. -->
{#key `${stage.id}:${app.phase}`}
  <div data-phase-body in:fly={{ x: 16 * direction, duration: motion(220), easing: cubicOut }}>
    {#if app.phase === 'brief'}
      <!-- Zoom in: from the whole to this stage's part of it. -->
      <p class="type-title m-0 mb-3 text-route italic">“{stage.feeling}”</p>
      <StageBridge {stage} cls="type-body m-0 mb-6 text-ink" />
      {#if app.map.goal}
        <div class="mb-6"><BigPicture focus={part?.id ?? null} /></div>
      {/if}
      <p class="type-body m-0 mb-6 text-ink"><Markup text={stage.task} /></p>
      <p class="type-body m-0 rounded-xl border-[1.5px] border-dashed border-route px-4 py-3 text-ink">
        <b class="type-heading mb-1 block text-route">{labels.checkpoint}</b><Markup
          text={stage.checkpoint}
        />
      </p>
    {:else}
      {#if method}
        <p class="type-lead m-0 mb-3 text-ink-2 italic">
          {method.lead}
          {method.title.toLowerCase()}
        </p>
      {/if}
      {#if app.phase === 'do' || app.phase === 'observe'}
        <StageSteps phase={app.phase} />
      {:else if app.phase === 'read'}
        <StageRead />
      {:else}
        <StageDone />
      {/if}
    {/if}
  </div>
{/key}

{#if app.phase !== 'done'}
  <div class="mt-6 flex justify-between gap-3">
    <button
      class="{pager} border border-rule bg-transparent"
      disabled={app.phase === 'brief'}
      onclick={() => app.back()}
    >
      {labels.phases.previous}
    </button>
    <button class="{pager} border border-route bg-route text-paper" onclick={() => app.forward()}>
      {#if lastItem && nextPhase}{fill(labels.phases.continueTo, { phase: nameOf(nextPhase) })}{:else}{labels
          .phases.next}{/if}
    </button>
  </div>
{/if}
