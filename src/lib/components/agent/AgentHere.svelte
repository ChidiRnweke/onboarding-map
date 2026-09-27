<script lang="ts">
  import BookOpenCheckIcon from '@lucide/svelte/icons/book-open-check';
  import FootprintsIcon from '@lucide/svelte/icons/footprints';
  import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
  import MapIcon from '@lucide/svelte/icons/map';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import PuzzleIcon from '@lucide/svelte/icons/puzzle';
  import SplineIcon from '@lucide/svelte/icons/spline';
  import { ACTIONS, type Anchor } from '$lib/agent/actions';
  import { getAgent } from '$lib/agent/agent.svelte';

  /**
   * The assistant, offered on the thing it would act on, and its answer, shown
   * right there.
   *
   * The mark is the same everywhere: a small route-tinted tile whose icon names
   * the subject, beside a label that says what will happen. It is quiet on
   * purpose, a ghost next to the controls it sits with, so it reads as part of
   * the step or the concept rather than a feature bolted on. `icon` drops the
   * label for a row with no room (a connection line), where the label moves to
   * the tooltip.
   *
   * The thread is only loaded once there is one, so a learner who never asks
   * downloads none of it.
   */
  let {
    anchor,
    title,
    variant = 'inline',
  }: {
    anchor: Exclude<Anchor, { kind: 'map' }>;
    /** What the anchor is called, for the thread's place in the assistant's view. */
    title: string;
    /**
     * `inline` is the action, then its answer in the same place. A row with no
     * room for the answer splits them: `compact` is the action alone (a small
     * tile and label that stays visible), `thread` the answer alone.
     */
    variant?: 'inline' | 'compact' | 'thread';
  } = $props();

  const agent = getAgent();
  const labels = $derived(agent.map.labels.agent);
  const thread = $derived(agent.thread(anchor));
  const label = $derived(ACTIONS[anchor.kind].label(labels));

  const icons = {
    step: FootprintsIcon,
    node: LightbulbIcon,
    edge: SplineIcon,
    read: BookOpenCheckIcon,
    checkpoint: ListChecksIcon,
    module: PuzzleIcon,
    region: MapIcon,
  };
  const Icon = $derived(icons[anchor.kind]);

  // Asking again where a thread already is just brings it back into view.
  const ask = () => {
    if (!thread?.turns.length) return agent.ask(anchor, title);
    document.getElementById(`agent-${thread.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
</script>

{#if agent.enabled}
  {#if variant === 'compact'}
    <button
      class="group/agent type-small inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent py-0.5 pr-1.5 pl-0.5 {thread
        ?.turns.length
        ? 'text-route'
        : 'text-ink-2 hover:text-ink'}"
      onclick={ask}
    >
      <span
        class="grid size-5 flex-none place-items-center rounded-md transition-colors {thread?.turns.length
          ? 'bg-route text-paper'
          : 'bg-route-soft text-route group-hover/agent:bg-route group-hover/agent:text-paper'}"
      >
        <Icon size={12} strokeWidth={2.2} />
      </span>
      {label}
    </button>
  {:else if thread?.turns.length}
    {#await import('./AgentThread.svelte') then { default: AgentThread }}
      <AgentThread {thread} {label} />
    {/await}
  {:else if variant === 'inline'}
    <button
      class="group/agent type-small mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent py-1 pr-2 pl-1 text-ink-2 hover:text-ink"
      onclick={ask}
    >
      <span
        class="grid size-5 flex-none place-items-center rounded-md bg-route-soft text-route transition-colors group-hover/agent:bg-route group-hover/agent:text-paper"
      >
        <Icon size={12} strokeWidth={2.2} />
      </span>
      {label}
    </button>
  {/if}
{/if}
