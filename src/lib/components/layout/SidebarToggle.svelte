<script lang="ts">
  import PanelRightIcon from '@lucide/svelte/icons/panel-right';
  import { getAppState } from '$lib/state.svelte';

  const app = getAppState();
  const sidebar = $derived(app.panel);
  const open = $derived(sidebar ? (sidebar.isMobile ? sidebar.openMobile : sidebar.open) : true);
  const label = $derived(app.map.labels.aria.togglePanel);
</script>

<button
  class="pointer-events-auto grid h-[34px] w-[34px] flex-none cursor-pointer place-items-center rounded-full border border-rule bg-paper-2 text-ink-2 hover:border-ink-2 hover:text-ink aria-expanded:text-ink"
  aria-label={label}
  aria-expanded={open}
  title="{label} (Ctrl/⌘ .)"
  onclick={() => sidebar?.toggle()}
>
  <PanelRightIcon size={16} />
</button>
