<script lang="ts">
  import { useSidebar } from '$lib/components/shadcn/sidebar/index.js';
  import { getAppState } from '$lib/state.svelte';

  // Hands the panel's sidebar state to the app, so controls that live in the
  // map can still reach it.
  const app = getAppState();
  app.panel = useSidebar();
</script>
