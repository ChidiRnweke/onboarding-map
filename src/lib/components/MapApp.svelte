<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { afterNavigate, replaceState } from '$app/navigation';
  import { load, mapKey, parseHash, save, toHash } from '$lib/progress';
  import * as Sidebar from '$lib/components/shadcn/sidebar/index.js';
  import { loadOpen, saveOpen } from '$lib/sidebars';
  import { setAppState } from '$lib/state.svelte';
  import { setTheme } from '$lib/theme.svelte';
  import BigPictureIntro from './goal/BigPictureIntro.svelte';
  import SidebarBridge from './layout/SidebarBridge.svelte';
  import MapView from './map/MapView.svelte';
  import Panel from './panel/Panel.svelte';
  import type { DerivedMap } from '$core/model';

  let { map }: { map: DerivedMap } = $props();

  // The map is loaded once and never changes for the life of the page, so
  // reading it once here is intentional.
  // svelte-ignore state_referenced_locally
  const app = setAppState(map);
  // svelte-ignore state_referenced_locally
  setTheme(map);

  // The panel starts open; a visitor's own choice is only known once mounted.
  let panelOpen = $state(true);
  // The space shifts with the phase: while doing or observing, the steps are
  // what matters and the map is context; for the brief, reading and the look
  // back, the map gets the room.
  const panelWidth = $derived(
    app.panelView === 'stage' && (app.phase === 'do' || app.phase === 'observe')
      ? 'min(620px, 46vw)'
      : '440px',
  );

  let restored = $state(false);
  // The page renders only in the browser, so it mounts before the router has
  // finished starting; replaceState() throws until then.
  let routerReady = $state(false);
  afterNavigate(() => (routerReady = true));
  onMount(() => {
    panelOpen = loadOpen('panel');

    // Open where the address points, or where the learner left off. The big
    // picture comes first on a first visit.
    app.restore(parseHash(location.hash));
    restored = true;
    if (map.goal && !load(mapKey(map), 'intro-seen', false)) app.introOpen = true;
  });

  // A link to another stage within the page (edited address, back button).
  function onhashchange() {
    const target = parseHash(location.hash);
    const stage = target && map.stages.find((s) => s.id === target.stage);
    if (!stage) return;
    if (stage.order !== app.stage) app.goto(stage.order);
    if (target.phase && app.phases.includes(target.phase)) app.setPhase(target.phase, target.step ?? 0);
  }

  // Once seen, the intro no longer opens by itself.
  $effect(() => {
    if (app.introOpen) save(mapKey(map), 'intro-seen', true);
  });

  // The address follows the learner, so a reload, a bookmark or a link sent to
  // a mentor opens the same stage, phase and step.
  $effect(() => {
    const hash = toHash(app.currentStage.id, app.phase, app.step, app.itemCount(app.phase) > 0);
    // untrack: replaceState reads the page's URL, which would otherwise make
    // this effect rerun on every hash change and write the old place back.
    if (restored && routerReady && location.hash !== hash) untrack(() => replaceState(hash, {}));
  });

  function onkeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('input, textarea')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (app.introOpen) return;

    // The arrows walk through the stage, one item at a time; with Shift they
    // jump between stages.
    if (event.key === 'ArrowRight') {
      if (event.shiftKey) app.goto(app.stage + 1);
      else app.forward();
    }
    if (event.key === 'ArrowLeft') {
      if (event.shiftKey) app.goto(app.stage - 1);
      else app.back();
    }
    if (event.key === 'Escape') {
      app.selectModule(null);
      app.select(null);
      app.selectPeriod(null);
      app.selectRegion(null);
      app.selectKind(null);
    }
  }
</script>

<svelte:window {onkeydown} {onhashchange} />

<BigPictureIntro />

<!-- The provider owns the panel's open state, its keyboard shortcut and its
     switch to a sheet on narrow screens. -->
<Sidebar.Provider
  bind:open={panelOpen}
  onOpenChange={(open) => saveOpen('panel', open)}
  shortcut="."
  style="--sidebar-width: {panelWidth}"
  class="h-svh min-h-0"
>
  <SidebarBridge />
  <Sidebar.Inset class="h-svh min-w-0 overflow-hidden bg-paper">
    <MapView />
  </Sidebar.Inset>
  <Sidebar.Root side="right" class="border-rule">
    <Panel />
  </Sidebar.Root>
</Sidebar.Provider>
