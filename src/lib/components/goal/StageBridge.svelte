<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import Markup from '../ui/Markup.svelte';
  import ModuleRef from '../ui/ModuleRef.svelte';
  import Template from '../ui/Template.svelte';
  import type { Stage } from '$core/model';

  // Ties a stage to the big picture: what exists so far and what this stage
  // adds. A stage's own `bridge` wins; otherwise it is put together from the
  // goal modules, so every map gets one without writing it.
  let { stage, cls = '' }: { stage: Stage; cls?: string } = $props();

  const app = getAppState();
  const labels = $derived(app.map.labels.bigPicture);

  const adds = $derived(app.moduleOf(stage));
  const built = $derived(app.modulesInOrder.filter((m) => app.moduleStateAt(m, stage.order) === 'done'));
  const template = $derived(!adds ? labels.bridgeNone : built.length ? labels.bridge : labels.bridgeFirst);
</script>

{#if app.map.goal}
  <p class={cls}>
    {#if stage.bridge}
      <Markup text={stage.bridge} />
    {:else}
      <Template text={template}>
        {#snippet slot(name)}{#if name === 'module' && adds}<ModuleRef
              id={adds.id}
            />{:else if name === 'done'}{#each built as m, i (m.id)}{i === 0
                ? ''
                : i === built.length - 1
                  ? ' & '
                  : ', '}<ModuleRef id={m.id} />{/each}{/if}{/snippet}
      </Template>
    {/if}
  </p>
{/if}
