<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import ModeToggle from '../layout/ModeToggle.svelte';
  import KindPanel from './KindPanel.svelte';
  import ModulePanel from './ModulePanel.svelte';
  import NodePanel from './NodePanel.svelte';
  import PeriodPanel from './PeriodPanel.svelte';
  import RegionPanel from './RegionPanel.svelte';
  import StagePanel from './StagePanel.svelte';

  const app = getAppState();

  let element = $state<HTMLElement | null>(null);

  // Scroll back to the top whenever the panel switches to something else,
  // matching the panel.scrollTop = 0 the original did on every navigation.
  $effect(() => {
    void app.stage;
    void app.selected;
    void app.module;
    void app.phase;
    void app.period;
    void app.region;
    void app.kind;
    element?.scrollTo(0, 0);
  });
</script>

<!-- The toggle sits outside the scrolling aside so it stays put as the panel
     content scrolls beneath it. -->
<div class="relative h-full min-h-0">
  <div class="absolute top-3 right-3 z-10">
    <ModeToggle />
  </div>
  <aside
    class="panel h-full min-h-0 overflow-x-hidden overflow-y-auto bg-panel p-6 pb-10 max-md:p-4 max-md:pb-8"
    bind:this={element}
    aria-live="polite"
  >
    {#if app.currentModule}
      <ModulePanel module={app.currentModule} />
    {:else if app.selectedNode}
      <NodePanel node={app.selectedNode} />
    {:else if app.period !== null}
      <PeriodPanel period={app.period} />
    {:else if app.region}
      <RegionPanel id={app.region} />
    {:else if app.kind}
      <KindPanel id={app.kind} />
    {:else}
      <StagePanel />
    {/if}
  </aside>
</div>
