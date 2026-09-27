<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { fade } from 'svelte/transition';
  import { motion } from '$lib/motion';
  import { getAppState } from '$lib/state.svelte';
  import { fill } from '$lib/text';
  import Markup from '../ui/Markup.svelte';
  import BigPicture from './BigPicture.svelte';
  import type { DerivedModule } from '$core/model';

  // The big picture, told before any part of it is built: first the whole, then
  // each part in the order the journey builds it, lighting up where it sits and
  // what it connects to. Opens by itself on a first visit; after that from the
  // overview or the goal bar.
  const app = getAppState();
  const goal = $derived(app.map.goal!);
  const labels = $derived(app.map.labels);
  const parts = $derived(app.modulesInOrder);

  // 0 is the whole, 1..n the parts, n + 1 the finish line.
  let card = $state(0);
  const last = $derived(parts.length + 1);
  const part = $derived(card >= 1 && card <= parts.length ? parts[card - 1] : null);

  $effect(() => {
    if (app.introOpen) card = 0;
  });

  // Parts told so far are drawn as if built, the one being told is current, the
  // rest stay sketched: the picture assembles as the story goes.
  const stateOf = (m: DerivedModule) => {
    const i = parts.indexOf(m) + 1;
    if (card > parts.length) return 'done';
    return i < card ? 'done' : i === card ? 'current' : 'ahead';
  };

  const stageOf = (m: DerivedModule) => app.map.stages.find((s) => s.order === m.stageOrder)!;
  const first = $derived(app.map.stages[0]);

  function start() {
    app.introOpen = false;
    app.goto(first.order);
    app.setPhase('brief');
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' && card < last) card++;
    if (event.key === 'ArrowLeft' && card > 0) card--;
  }

  let forward = $state<HTMLButtonElement | null>(null);

  const button = 'type-body cursor-pointer rounded-full px-5 py-2.5';
</script>

{#if app.map.goal}
  <Dialog.Root bind:open={app.introOpen}>
    <Dialog.Portal>
      <Dialog.Overlay
        class="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--paper)_80%,transparent)] backdrop-blur-[3px] data-open:animate-in data-open:fade-in-0"
      />
      <Dialog.Content
        class="fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100svh-24px)] w-[min(1120px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 overflow-y-auto rounded-[18px] border border-rule-soft bg-panel p-10 text-ink shadow-xl outline-none md:h-[min(680px,calc(100svh-24px))] max-md:grid-cols-1 max-md:gap-5 max-md:p-5"
        {onkeydown}
        onOpenAutoFocus={(e) => {
          // Focus the way forward without scrolling to it: on a phone the
          // first focusable thing is far down, past the heading.
          e.preventDefault();
          forward?.focus({ preventScroll: true });
        }}
      >
        <div class="self-center max-md:order-2">
          <BigPicture
            width={420}
            {stateOf}
            focus={part?.id ?? null}
            onpick={(id) => (card = parts.findIndex((m) => m.id === id) + 1)}
          />
        </div>

        <!-- The dialog keeps one height from card to card, so the picture
             never shifts; only the words change. -->
        <div class="flex min-h-0 flex-col max-md:order-1" aria-live="polite">
          {#key card}
            <div class="min-h-0 overflow-y-auto" in:fade={{ duration: motion(250) }}>
              {#if card === 0}
                <p class="type-small m-0 mb-3 text-ink-2">{labels.bigPicture.heading}</p>
                <Dialog.Title class="type-display m-0 mb-3">
                  {goal.title}
                </Dialog.Title>
                <p class="type-title m-0 mb-3">
                  <Markup text={goal.statement} />
                </p>
                {#if goal.story}
                  <Dialog.Description class="type-lead m-0 text-ink-2">
                    <Markup text={goal.story} />
                  </Dialog.Description>
                {/if}
              {:else if part}
                <p class="type-small m-0 mb-3 text-ink-2">
                  {fill(labels.bigPicture.part, { n: card, total: parts.length })}
                </p>
                <h2 class="type-display m-0 mb-3">
                  {part.title}{#if part.optional}<span
                      class="type-meta ml-2 inline-block rounded-full border border-rule px-2 py-px align-middle text-ink-2"
                      >{labels.goal.optional}</span
                    >{/if}
                </h2>
                <p class="type-title m-0 mb-6"><Markup text={part.purpose} /></p>
                {#if part.dependsOn.length}
                  <ul class="type-body m-0 mb-6 grid list-none gap-1 p-0">
                    {#each part.dependsOn as dep (dep)}
                      <li>
                        <span class="font-serif text-ink-2 italic"
                          >{part.relations?.find((r) => r.to === dep)?.verb ??
                            labels.bigPicture.buildsOn}</span
                        >
                        <span class="font-[650]">{app.map.moduleById[dep].title}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}
                <p class="type-body m-0 text-ink-2">
                  {fill(labels.bigPicture.builtIn, {
                    stage: fill(labels.node.onRouteStage, {
                      stageNumber: stageOf(part).order,
                      stageTitle: stageOf(part).title,
                    }),
                  })}
                </p>
              {:else}
                <p class="type-small m-0 mb-3 text-ink-2">{labels.goal.doneWhen}</p>
                <h2 class="type-display m-0 mb-3">
                  {goal.title}
                </h2>
                <p class="type-title m-0"><Markup text={goal.doneWhen} /></p>
              {/if}
            </div>
          {/key}

          <div class="mt-auto flex items-center gap-2.5 pt-6">
            {#if card > 0}
              <button class="{button} border border-rule" onclick={() => card--}
                >{labels.bigPicture.back}</button
              >
            {:else}
              <Dialog.Close class="{button} text-ink-2 hover:text-ink">{labels.bigPicture.skip}</Dialog.Close>
            {/if}
            <span class="flex flex-1 justify-center gap-1" aria-hidden="true">
              {#each Array.from({ length: last + 1 }, (_, i) => i) as i (i)}
                <span
                  class="h-[6px] w-[6px] rounded-full transition-colors duration-300 {i === card
                    ? 'bg-route'
                    : 'bg-rule'}"
                ></span>
              {/each}
            </span>
            {#if card < last}
              <button
                bind:this={forward}
                class="{button} border border-route bg-route text-paper"
                onclick={() => card++}>{labels.bigPicture.next}</button
              >
            {:else}
              <button
                bind:this={forward}
                class="{button} border border-route bg-route text-paper"
                onclick={start}>{fill(labels.bigPicture.start, { stage: first.title })}</button
              >
            {/if}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
{/if}
