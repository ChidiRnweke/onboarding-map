<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { getAppState } from '$lib/state.svelte';
  import { getTheme } from '$lib/theme.svelte';
  import AgentHere from '../agent/AgentHere.svelte';

  // Read, after the doing: each concept the stage touched, named, placed in the
  // part of the goal it belongs to, and opened in the panel with its docs.
  // Hovering one finds it on the map; opening it ticks it off.
  const app = getAppState();
  const theme = getTheme();
  const labels = $derived(app.map.labels);

  const items = $derived(
    app.currentStage.read.map((id) => {
      const node = app.map.byId[id];
      const part = (app.map.nodeModules[id] ?? [])[0];
      return {
        node,
        part: part ? app.map.moduleById[part] : null,
        read: app.stageProgress.read.includes(id),
      };
    }),
  );

  function open(id: string) {
    app.markRead(id);
    app.hovered = null;
    app.select(id);
  }
</script>

<ul class="m-0 grid list-none gap-1 p-0">
  {#each items as { node, part, read } (node.id)}
    <li>
      <button
        class="flex w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2 text-left hover:bg-route-soft"
        onclick={() => open(node.id)}
        onmouseenter={() => (app.hovered = node.id)}
        onmouseleave={() => (app.hovered = null)}
      >
        <span class="size-2.5 flex-none rounded-full" style="background:{theme.tone(node.domain)}"></span>
        <span class="min-w-0 flex-1">
          <span class="type-body block {read ? 'text-ink-2' : 'font-[600] text-ink'}">{node.label}</span>
          {#if part}
            <span class="type-meta block text-ink-2">{part.title}</span>
          {/if}
        </span>
        {#if read}
          <span class="grid size-5 flex-none place-items-center rounded-full bg-route-soft text-route"
            ><CheckIcon size={12} strokeWidth={2.5} /><span class="sr-only">{labels.phases.markRead}</span
            ></span
          >
        {/if}
      </button>
    </li>
  {/each}
</ul>

<AgentHere
  anchor={{ kind: 'read', stage: app.currentStage.id }}
  title="{app.currentStage.title} · {labels.phases.read}"
/>
