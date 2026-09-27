<script lang="ts">
  import type { Snippet } from 'svelte';

  // The top of every panel, so they all share one rhythm: the way back (or
  // the tour), then the context the thing sits in, its title, and chips that
  // say what it is and where it stands. Gaps follow the scale in app.css:
  // 24 between the nav and the block, 12 inside the block, 24 after it.
  let {
    title,
    nav,
    context,
    chips,
    compact = false,
  }: {
    title: string;
    nav?: Snippet;
    context?: Snippet;
    chips?: Snippet;
    /** A smaller title, for panels whose content is the point (a stage mid-way). */
    compact?: boolean;
  } = $props();
</script>

<header class="mb-6">
  {#if nav}
    <!-- Right padding keeps the row clear of the theme toggle over the panel. -->
    <div class="mb-6 flex min-h-8 items-center gap-3 pr-10">{@render nav()}</div>
  {/if}
  {#if context}
    <div class="type-meta mb-3 flex flex-wrap items-center gap-1 text-ink-2">{@render context()}</div>
  {/if}
  <!-- The size eases when a panel switches between a display and a compact title. -->
  <h2
    class="m-0 transition-[font-size,line-height] duration-300 ease-out motion-reduce:transition-none {compact
      ? 'type-title'
      : 'type-display'}"
  >
    {title}
  </h2>
  {#if chips}
    <div class="mt-3 flex flex-wrap items-center gap-2">{@render chips()}</div>
  {/if}
</header>
