<script lang="ts">
  import { getAppState } from '$lib/state.svelte';
  import YouAreHere from '../goal/YouAreHere.svelte';
  import SidebarToggle from '../layout/SidebarToggle.svelte';
  import Journey from './Journey.svelte';
  import MapLegend from './MapLegend.svelte';
  import RadialMap from './RadialMap.svelte';
  import ViewSwitch from './ViewSwitch.svelte';
  import ZoomControls from './ZoomControls.svelte';

  const app = getAppState();

  let map = $state<ReturnType<typeof RadialMap> | null>(null);
</script>

<!-- @container drives the journey strip: it collapses to numbered circles once
     the map column itself is narrow, independently of the window width. -->
<section
  class="stage-area relative h-full min-h-0 overflow-hidden @container"
  aria-label={app.map.labels.aria.map}
>
  <RadialMap bind:this={map} />

  <!-- The map's title lived in the overview sidebar; the page keeps it as its
       heading for screen readers. -->
  <h1 class="sr-only">{app.map.title}</h1>

  <!-- Chrome over the map. The rows let clicks through to the map except on the
       controls themselves. Top left: how the map is shown and what it means,
       wrapping the legend under the controls only when the row runs out of
       room; the right padding keeps it clear of the corner. -->
  <div
    class="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start gap-[10px] p-[18px] pr-[62px] max-md:p-[10px] max-md:pr-[54px] @4xl:pr-[330px]"
  >
    <div class="flex flex-none items-center gap-[10px]">
      <ViewSwitch />
      <ZoomControls zoomIn={() => map?.zoomIn()} zoomOut={() => map?.zoomOut()} fit={() => map?.fit(400)} />
    </div>
    <div class="flex-none">
      <MapLegend />
    </div>
  </div>
  <div class="absolute top-[18px] right-[18px] max-md:top-[10px] max-md:right-[10px]">
    <SidebarToggle />
  </div>
  <!-- Level with the panel toggle when the map is wide enough for one row;
       otherwise under it, clear of the controls. -->
  <div
    class="pointer-events-none absolute top-[62px] right-[18px] max-md:hidden @4xl:top-[18px] @4xl:right-[62px]"
  >
    <YouAreHere />
  </div>

  <div
    class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start px-[20px] pb-[18px] max-md:px-[10px] max-md:pb-[10px]"
  >
    <Journey />
  </div>
</section>
