<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import { fly } from 'svelte/transition';
  import type { Anchor } from '$lib/agent/actions';
  import { getAgent, type Thread } from '$lib/agent/agent.svelte';
  import { PROVIDERS } from '$lib/agent/providers';
  import { motion } from '$lib/motion';
  import { fill } from '$lib/text';
  import * as PromptInput from '$lib/components/ai/prompt-input';
  import PanelHeader from '../ui/PanelHeader.svelte';
  import PanelSection from '../ui/PanelSection.svelte';
  import Template from '../ui/Template.svelte';
  import AgentThread from './AgentThread.svelte';
  import ProviderSetup from './ProviderSetup.svelte';

  /**
   * The assistant's own place in the panel, for questions no step or concept
   * owns. It opens by saying what the assistant knows: this map, and where the
   * learner stands on it, re-said whenever they move, so they can see it
   * re-orient. Below: the open question, then what was asked elsewhere, each
   * leading back to where it was asked.
   */
  const agent = getAgent();
  const app = agent.app;
  const labels = $derived(app.map.labels);
  const anchor: Anchor = { kind: 'map' };
  const thread = $derived(agent.thread(anchor));
  const elsewhere = $derived(agent.recent.filter((t) => t.key !== 'map').slice(0, 8));

  let draft = $state('');
  let settingsOpen = $state(false);

  const place = $derived.by(() => {
    const s = app.currentStage;
    const phase = labels.phases[app.phase];
    const stepped = (app.phase === 'do' || app.phase === 'observe') && app.itemCount(app.phase) > 0;
    return `stage ${s.order}, ${s.title} · ${phase}${stepped ? ` ${app.step + 1}` : ''}`;
  });

  function send() {
    const text = draft.trim();
    if (!text) return;
    draft = '';
    agent.ask(anchor, labels.agent.ask, text);
  }

  /** Back to where a thread was asked, where it is shown in full. */
  function visit(t: Thread) {
    const a = t.anchor;
    const order = (id: string) => app.map.stages.find((s) => s.id === id)?.order;
    if (a.kind === 'node') return app.select(a.id);
    if (a.kind === 'edge') return app.select(a.from);
    if (a.kind === 'module') return app.selectModule(a.id);
    if (a.kind === 'region') return app.selectRegion(a.id);
    if (a.kind === 'step' || a.kind === 'read' || a.kind === 'checkpoint') {
      const o = order(a.stage);
      if (!o) return;
      app.goto(o);
      if (a.kind === 'step') app.setPhase(a.phase, a.index);
      else if (a.kind === 'read') app.setPhase('read');
      else app.setPhase('done');
    }
  }
</script>

<PanelHeader title={labels.agent.ask} compact>
  {#snippet nav()}
    <button
      class="type-small inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-ink-2 hover:text-ink"
      onclick={() => app.setAgentOpen(false)}><ArrowLeftIcon size={14} /> {app.currentStage.title}</button
    >
  {/snippet}
</PanelHeader>

{#key place}
  <p class="type-lead m-0 text-balance" in:fly={{ y: 4, duration: motion(160) }}>
    <Template text={labels.agent.context}>
      {#snippet slot()}<strong class="font-semibold text-route">{place}</strong>{/snippet}
    </Template>
  </p>
{/key}

{#if thread?.turns.length}
  <AgentThread {thread} label={labels.agent.ask} composer={false} />
{/if}

{#if thread?.status !== 'setup'}
  <PromptInput.Root
    value={draft}
    onValueChange={(v) => (draft = v)}
    onSubmit={send}
    isLoading={thread?.status === 'running'}
    class="mt-5 rounded-xl border border-rule bg-paper p-0"
  >
    <div class="flex items-end gap-1 p-1.5">
      <PromptInput.Textarea
        placeholder="What do you want to know about the map, the route, or where you are?"
        class="type-small min-h-10 border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
      />
      <button
        class="grid size-8 flex-none cursor-pointer place-items-center rounded-full border-0 bg-route text-paper disabled:cursor-default disabled:opacity-40"
        aria-label={labels.agent.ask}
        disabled={!draft.trim() || thread?.status === 'running'}
        onclick={send}><ArrowUpIcon size={15} /></button
      >
    </div>
  </PromptInput.Root>
{/if}

{#if elsewhere.length}
  <PanelSection heading="Asked on the map">
    <ul class="m-0 grid list-none gap-0 p-0">
      {#each elsewhere as t (t.key)}
        <li>
          <button
            class="type-small flex w-full cursor-pointer items-baseline gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left hover:bg-route-soft"
            onclick={() => visit(t)}
          >
            <span class="min-w-0 flex-1 truncate text-ink">{t.title}</span>
            <span class="flex-none text-muted">{t.turns[0]?.text}</span>
          </button>
        </li>
      {/each}
    </ul>
  </PanelSection>
{/if}

<PanelSection heading={labels.agent.settings}>
  {#if agent.connection && !settingsOpen}
    {@const c = agent.connection}
    <p class="type-small m-0 text-ink-2">
      {PROVIDERS[c.provider].label}{c.model ? ` · ${c.model}` : ''}
      {#if !agent.keyless}· {c.remember ? 'remembered on this device' : 'for this session'}{/if}
    </p>
    <div class="mt-2 flex gap-2">
      {#if !agent.keyless}
        <button
          class="type-small cursor-pointer rounded-full border border-rule bg-transparent px-3 py-1 text-ink-2 hover:border-ink-2"
          onclick={() => (settingsOpen = true)}>Change</button
        >
        <button
          class="type-small cursor-pointer rounded-full border border-rule bg-transparent px-3 py-1 text-ink-2 hover:border-ink-2"
          onclick={() => agent.forgetKey()}>{labels.agent.forget}</button
        >
      {/if}
    </div>
  {:else}
    <ProviderSetup ondone={() => (settingsOpen = false)} />
  {/if}
</PanelSection>

<p class="type-meta m-0 mt-6 text-muted">
  {fill(labels.agent.provenance, { model: agent.connection?.model || 'your model' })}. Your key never leaves
  this browser except to the provider.
</p>
