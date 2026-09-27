<script lang="ts">
  import type { Snippet } from 'svelte';

  // A section of a panel: its heading, then its content. 32 above, 12 under
  // the heading, per the scale in app.css.
  let { heading, children }: { heading: string; children: Snippet } = $props();
</script>

<section class="mt-8">
  <h3 class="type-heading m-0 mb-3 text-ink">{heading}</h3>
  {@render children()}
</section>
