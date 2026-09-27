<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { fade } from 'svelte/transition';
  import { motion } from '$lib/motion';
  import { getAppState } from '$lib/state.svelte';
  import Markup from '../ui/Markup.svelte';
  import TipCard from './TipCard.svelte';

  // Do or Observe, one line at a time. The line in hand is open, with its tip
  // and note; the ones before it fold to a single ticked line, the ones after
  // to a single dimmed line. Any line can be opened by clicking it.
  let { phase }: { phase: 'do' | 'observe' } = $props();

  const app = getAppState();
  const labels = $derived(app.map.labels);
  const steps = $derived(app.steps(app.currentStage, phase));
</script>

<ol class="m-0 grid list-none gap-1 p-0">
  {#each steps as step, i (i)}
    {@const current = i === app.step}
    {@const past = i < app.step}
    <li
      class="rounded-xl border transition-colors {current
        ? 'border-route bg-panel p-4'
        : 'border-transparent'}"
    >
      {#if current}
        <div class="flex gap-3" in:fade={{ duration: motion(180) }}>
          <span
            class="type-meta mt-0.5 grid size-5.5 flex-none place-items-center rounded-full bg-route font-semibold text-paper tabular-nums"
            >{i + 1}</span
          >
          <div class="min-w-0 flex-1">
            <p class="type-body m-0"><Markup text={step.text} /></p>
            {#key `${app.currentStage.id}:${phase}:${i}`}
              <TipCard {step} />
            {/key}
            {#if step.note}
              <textarea
                class="type-small mt-3 block min-h-18 w-full resize-y rounded-lg border border-rule bg-paper px-3 py-2 outline-none focus:border-route"
                placeholder={labels.phases.notePlaceholder}
                value={app.note(`${phase}:${i}`)}
                oninput={(e) => app.setNote(`${phase}:${i}`, e.currentTarget.value)}></textarea>
            {/if}
          </div>
        </div>
      {:else}
        <button
          class="flex w-full cursor-pointer items-start gap-3 rounded-lg border-0 bg-transparent px-4 py-2 text-left hover:bg-route-soft"
          onclick={() => app.setPhase(phase, i)}
        >
          <span
            class="type-meta grid size-5.5 flex-none place-items-center rounded-full font-semibold tabular-nums {past
              ? 'bg-route-soft text-route'
              : 'border border-dashed border-muted text-muted'}"
          >
            {#if past}<CheckIcon size={13} strokeWidth={2.5} />{:else}{i + 1}{/if}
          </span>
          <span class="type-small line-clamp-1 min-w-0 flex-1 pt-0.5 {past ? 'text-ink-2' : 'text-muted'}"
            ><Markup text={step.text} /></span
          >
        </button>
      {/if}
    </li>
  {/each}
</ol>
