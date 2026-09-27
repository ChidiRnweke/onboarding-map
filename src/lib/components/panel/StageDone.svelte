<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import BigPicture from '../goal/BigPicture.svelte';
  import Markup from '../ui/Markup.svelte';
  import PanelSection from '../ui/PanelSection.svelte';
  import ModuleRef from '../ui/ModuleRef.svelte';
  import RefsSection from '../ui/RefsSection.svelte';
  import Template from '../ui/Template.svelte';

  // The checkpoint, then the step back: the whole picture again, the part this
  // stage built now solid, what exists because of it, and the part that comes
  // next. This is where the stage is hung back on the frame.
  const app = getAppState();
  const labels = $derived(app.map.labels);
  const stage = $derived(app.currentStage);
  const built = $derived(app.moduleOf(stage));
  const finished = $derived(!!stage.delivers?.length);
  const next = $derived(app.map.stages.find((s) => s.order === stage.order + 1));
  const nextPart = $derived(next ? app.moduleOf(next) : null);

  // Notes the learner wrote along the way, in the order they were asked for.
  const notes = $derived(
    (['do', 'observe'] as const).flatMap((phase) =>
      app
        .steps(stage, phase)
        .map((step, i) => ({ step, text: app.note(`${phase}:${i}`) }))
        .filter((n) => n.step.note && n.text.trim()),
    ),
  );
</script>

<p class="type-body m-0 rounded-xl border-[1.5px] border-dashed border-route px-4 py-3 text-ink">
  <b class="type-heading mb-1 block text-route">{labels.checkpoint}</b><Markup text={stage.checkpoint} />
</p>

{#if notes.length}
  <PanelSection heading={labels.bigPicture.yourNotes}>
    <ul class="m-0 grid list-none gap-3 p-0">
      {#each notes as note, i (i)}
        <li class="type-small border-l-2 border-route-soft pl-3">
          <span class="type-meta block text-ink-2"><Markup text={note.step.text} /></span>
          <span class="whitespace-pre-line">{note.text}</span>
        </li>
      {/each}
    </ul>
  </PanelSection>
{/if}

{#if app.map.goal}
  <section class="mt-8">
    <h3 class="type-title m-0 mb-3 italic">{labels.bigPicture.lookBack}</h3>
    <!-- Drawn as it stands after this stage, pointing at what comes next. -->
    <BigPicture at={stage.order + 1} focus={nextPart?.id ?? null} />
    {#if built && finished}
      <p class="type-body m-0 mt-6 mb-2">
        <Template text={labels.bigPicture.nowBuilt}>
          {#snippet slot()}<ModuleRef id={built.id} />{/snippet}
        </Template>
      </p>
      <ul class="m-0 grid list-none gap-1 p-0">
        {#each built.produces as produced, i (i)}
          <li
            class="type-small relative pl-4 before:absolute before:top-[0.62em] before:left-0.5 before:h-[1.5px] before:w-1.5 before:bg-ink-2 before:content-['']"
          >
            <Markup text={produced} />
          </li>
        {/each}
      </ul>
    {/if}
    {#if nextPart && nextPart.id !== built?.id}
      <p class="type-small m-0 mt-6 text-ink-2">
        <span class="font-[650] text-ink">{labels.bigPicture.nextUp}:</span>
        <ModuleRef id={nextPart.id} />. <Markup text={nextPart.purpose} />
      </p>
    {/if}
  </section>
{/if}

{#if stage.refs}
  <div class="mt-8"><RefsSection refs={stage.refs} /></div>
{/if}

{#if next}
  <button
    class="type-body mt-8 w-full cursor-pointer rounded-full border border-route bg-route px-4 py-2.5 text-paper"
    onclick={() => app.complete()}>{labels.phases.complete} → {next.title}</button
  >
{:else}
  <p class="type-title mt-8 mb-0 text-center text-route italic">{labels.pager.complete}</p>
{/if}
