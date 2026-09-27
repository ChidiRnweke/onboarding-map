<script lang="ts">
  import MinusIcon from '@lucide/svelte/icons/minus';
  import { getAppState } from '$lib/state.svelte';
  import { fill } from '$lib/text';
  import BigPicture from './BigPicture.svelte';

  // The big picture in miniature, always in view over the map: the goal's
  // parts as they stand, the one the current stage builds ringed. Whatever the
  // learner is doing, this is where it fits. Shrinks to a chip when in the way,
  // for this visit only: it is always open on arrival.
  const app = getAppState();
  const labels = $derived(app.map.labels);
  // The part the learner is looking at: a selected part, the part a selected
  // concept belongs to, else the one the current stage builds.
  const part = $derived(
    app.module
      ? app.map.moduleById[app.module]
      : app.selected && app.map.nodeModules[app.selected]?.length
        ? app.map.moduleById[app.map.nodeModules[app.selected][0]]
        : app.moduleOf(app.currentStage),
  );

  let expanded = $state(true);

  const card =
    'pointer-events-auto border border-rule-soft bg-[color-mix(in_srgb,var(--paper-2)_90%,transparent)] backdrop-blur-[6px]';
  const progress = $derived(
    fill(labels.goal.progress, { done: app.modulesDone, total: app.map.modules.length }),
  );
</script>

{#if app.map.goal}
  {#if expanded}
    <section class="{card} rounded-[14px] w-[250px] px-3 pt-2 pb-3" aria-label={labels.bigPicture.youAreHere}>
      <header class="mb-2 flex items-center gap-2">
        <h2 class="type-small m-0 flex-1 font-serif font-normal text-ink-2 italic">
          {labels.bigPicture.youAreHere}
        </h2>
        <button
          class="grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-ink-2 hover:bg-route-soft hover:text-ink"
          aria-label={labels.legend.hide}
          title={labels.legend.hide}
          onclick={() => (expanded = false)}><MinusIcon size={14} /></button
        >
      </header>
      <BigPicture width={226} compact focus={part?.id ?? null} />
      <div class="mt-2.5 flex items-center justify-between gap-2 type-meta text-ink-2">
        <span class="tabular-nums">{progress}</span>
        <button
          class="cursor-pointer border-0 bg-transparent p-0 text-route underline decoration-route-soft underline-offset-[3px] hover:decoration-current"
          onclick={() => (app.introOpen = true)}>{labels.bigPicture.open}</button
        >
      </div>
    </section>
  {:else}
    <button
      class="{card} flex h-[34px] cursor-pointer items-center rounded-full px-3.5 type-small font-serif text-ink-2 italic hover:text-ink"
      onclick={() => (expanded = true)}
      >{labels.bigPicture.youAreHere} · {app.modulesDone}/{app.map.modules.length}</button
    >
  {/if}
{/if}
