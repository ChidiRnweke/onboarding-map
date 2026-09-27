<script lang="ts">
  import { getAppState } from '$lib/state.svelte';

  const app = getAppState();
</script>

<!-- Where the journey starts. -->
<g>
  <circle r="26" fill="var(--paper-2)" stroke="var(--route)" stroke-width="1.5" />
  <circle r="4" fill="var(--route)" />
  <text class="fill-ink font-serif text-[17px] italic" y="48" text-anchor="middle"
    >{app.map.labels.start}</text
  >
</g>
