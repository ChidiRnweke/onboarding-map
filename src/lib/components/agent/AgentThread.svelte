<script lang="ts">
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import SquareIcon from '@lucide/svelte/icons/square';
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import XIcon from '@lucide/svelte/icons/x';
  import { slide } from 'svelte/transition';
  import { getAgent, type Thread } from '$lib/agent/agent.svelte';
  import { motion } from '$lib/motion';
  import { fill } from '$lib/text';
  import * as PromptInput from '$lib/components/ai/prompt-input';
  import { TextShimmer } from '$lib/components/ai/text-shimmer';
  import TouchedRow from './TouchedRow.svelte';

  /**
   * An answer where the question was asked: under the step, the link, the
   * checkpoint. It is a flat block with one route-coloured rule down its left
   * edge rather than a card, so it reads as a note added to the page, and its
   * caption says which model wrote it, so it is never taken for the map's own
   * words.
   *
   * What the answer did on the map is listed above its text, one line per
   * thing touched, and a move comes with the way back. A thread from an
   * earlier visit starts folded to one line; the place remembers what was
   * asked there without making the learner read it again.
   */
  let {
    thread,
    label,
    composer = true,
    carried = false,
  }: {
    thread: Thread;
    /** The place's action, heading the thread until it has a first question of its own. */
    label: string;
    /** A follow-up field under the answer. */
    composer?: boolean;
    /** Shown away from its place, after the answer moved the learner: says where it was asked. */
    carried?: boolean;
  } = $props();

  const agent = getAgent();
  const labels = $derived(agent.map.labels.agent);

  // Open if asked during this visit; folded if it comes from an earlier one.
  // svelte-ignore state_referenced_locally
  let open = $state(agent.fresh(thread.key) || thread.status !== 'idle');
  let draft = $state('');

  const running = $derived(thread.status === 'running');
  const last = $derived(thread.turns.at(-1));
  const lastAnswer = $derived(thread.turns.findLast((t) => t.role === 'assistant'));
  // Later user turns are follow-ups; the first one is the action, which heads the thread.
  const turns = $derived(thread.turns.slice(1));

  function send() {
    const text = draft.trim();
    if (!text || running) return;
    draft = '';
    agent.ask(thread.anchor, thread.title, text);
  }
</script>

<section
  id={carried ? undefined : `agent-${thread.key}`}
  class="border-l-2 border-route pl-3 {carried ? 'mb-6' : 'mt-3'}"
  aria-live="polite"
  aria-busy={running}
  transition:slide={{ duration: motion(180) }}
>
  <header class="flex items-center gap-2 {carried ? 'pr-22' : ''}">
    <button
      class="type-small flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-left font-semibold text-route"
      aria-expanded={open}
      onclick={() => (open = !open)}
    >
      <ChevronRightIcon size={13} class="flex-none transition-transform {open ? 'rotate-90' : ''}" />
      <!-- What was asked first: the action pressed ("Check what I noticed") or the learner's words. -->
      <span class={carried ? 'flex-none' : 'truncate'}>{thread.turns[0]?.text ?? label}</span>
      {#if carried}<span class="truncate font-normal text-ink-2">· {thread.title}</span>{/if}
      {#if !open}<span class="font-normal text-muted">· {labels.earlier}</span>{/if}
    </button>
    {#if !running}
      <button
        class="grid size-6 flex-none cursor-pointer place-items-center rounded-md border-0 bg-transparent text-muted hover:text-ink"
        aria-label="Clear"
        title="Clear"
        onclick={() => agent.clear(thread.key)}><XIcon size={13} /></button
      >
    {/if}
  </header>

  {#if open}
    <div class="grid gap-3 pt-2" transition:slide={{ duration: motion(160) }}>
      {#each turns as turn, i (i)}
        {#if turn.role === 'user'}
          <p class="type-small m-0 justify-self-end rounded-xl bg-route-soft px-3 py-1.5 text-ink">
            {turn.text}
          </p>
        {:else}
          <div class="grid min-w-0 gap-2">
            {#if turn.touched.length}
              <ul class="m-0 grid list-none gap-0 p-0">
                {#each turn.touched as item (item.id)}<TouchedRow {item} />{/each}
              </ul>
            {/if}

            {#if turn.text}
              {#await import('./AnswerText.svelte')}
                <p class="type-small m-0 whitespace-pre-wrap text-ink">{turn.text}</p>
              {:then { default: AnswerText }}
                <AnswerText text={turn.text} />
              {/await}
            {:else if running && turn === last}
              <TextShimmer class="type-small"
                >{turn.touched.length ? 'Looking at the map…' : 'Thinking…'}</TextShimmer
              >
            {/if}

            {#if turn.error}
              <div class="type-small rounded-lg border border-rule bg-paper px-3 py-2 text-ink">
                <p class="m-0">{turn.error}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button
                    class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rule bg-transparent px-2.5 py-0.5 text-ink-2 hover:border-ink-2"
                    onclick={() => agent.retry(thread.key)}><RotateCcwIcon size={12} /> {labels.retry}</button
                  >
                  <button
                    class="cursor-pointer rounded-full border border-rule bg-transparent px-2.5 py-0.5 text-ink-2 hover:border-ink-2"
                    onclick={() => agent.reconfigure(thread.key)}>{labels.settings}</button
                  >
                </div>
              </div>
            {/if}

            {#if turn.before && !running}
              <button
                class="type-small inline-flex cursor-pointer items-center gap-1.5 justify-self-start rounded-full border border-route bg-transparent px-3 py-1 text-route hover:bg-route-soft"
                onclick={() => agent.back(turn)}><Undo2Icon size={13} /> {labels.back}</button
              >
            {/if}

            {#if turn.model && (turn.text || !running)}
              <p class="type-meta m-0 text-muted">{fill(labels.provenance, { model: turn.model })}</p>
            {/if}
          </div>
        {/if}
      {/each}

      {#if thread.status === 'setup'}
        {#await import('./ProviderSetup.svelte') then { default: ProviderSetup }}
          <ProviderSetup />
        {/await}
      {:else if running}
        <button
          class="type-small inline-flex cursor-pointer items-center gap-1.5 justify-self-start rounded-full border border-rule bg-transparent px-3 py-1 text-ink-2 hover:border-ink-2"
          onclick={() => agent.stop(thread.key)}
          ><SquareIcon size={11} fill="currentColor" /> {labels.stop}</button
        >
      {:else if composer && lastAnswer && !lastAnswer.error}
        <PromptInput.Root
          value={draft}
          onValueChange={(v) => (draft = v)}
          onSubmit={send}
          isLoading={running}
          class="rounded-xl border border-rule bg-paper p-0"
        >
          <div class="flex items-end gap-1 p-1">
            <PromptInput.Textarea
              placeholder={labels.followUp}
              class="type-small min-h-8 border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0"
            />
            <button
              class="grid size-7 flex-none cursor-pointer place-items-center rounded-full border-0 bg-route text-paper disabled:cursor-default disabled:opacity-40"
              aria-label={labels.followUp}
              disabled={!draft.trim()}
              onclick={send}><ArrowUpIcon size={14} /></button
            >
          </div>
        </PromptInput.Root>
      {/if}
    </div>
  {/if}
</section>
