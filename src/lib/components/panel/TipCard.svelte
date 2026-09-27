<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import { fill } from '$lib/text';
  import type { StepDetail } from '$core/model';

  // The help under a step. A copy tip (a prompt, a command, a phrase) shows its
  // start and a copy button, which is the thing to do with it; the full text is
  // one click away. A reveal tip (a hint, an answer) stays hidden until asked for,
  // so the learner tries without it first.
  let { step }: { step: StepDetail } = $props();

  const labels = $derived(getAppState().map.labels.tip);
  const reveal = $derived(step.tipKind === 'reveal');

  let open = $state(false);
  let copied = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(step.tip!);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      // Clipboard can be blocked; opening the tip makes it selectable by hand.
      open = true;
    }
  }
</script>

{#if step.tip}
  {#if reveal && !open}
    <button
      class="type-small mt-3 cursor-pointer rounded-full border border-dashed border-route bg-transparent px-3 py-1 text-route hover:bg-route-soft"
      onclick={() => (open = true)}>{fill(labels.reveal, { label: labels.hint })}</button
    >
  {:else}
    <div class="mt-3 rounded-lg border border-rule-soft bg-paper px-4 py-3">
      <div class="mb-2 flex items-center gap-3">
        <span class="type-small flex-1 font-serif text-ink-2 italic"
          >{reveal ? labels.hint : labels.label}</span
        >
        {#if !reveal}
          <button
            class="type-small cursor-pointer rounded-full border border-route bg-route px-3 py-1 text-paper"
            onclick={copy}>{copied ? labels.copied : labels.copy}</button
          >
        {/if}
      </div>
      <!-- Clamped to three lines until opened; a click anywhere on it opens it. -->
      <!-- The clamp sits on an inner span: line-clamp sets its own display, which
           a display utility on the same element would override. -->
      <button
        class="type-small block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-ink"
        aria-expanded={open || reveal}
        onclick={() => (open = !open)}
        ><span class={open || reveal ? '' : 'line-clamp-3'}>“{step.tip}”</span></button
      >
    </div>
  {/if}
{/if}
