<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>Map not shown</title>
</svelte:head>

<main class="mx-auto max-w-2xl p-8">
  <h1 class="mb-2 text-2xl font-semibold">{page.error?.message}</h1>
  {#if page.error?.issues?.length}
    <p class="mb-4 text-muted-foreground">Fix these in the map file; the page reloads when you save.</p>
    <ul class="space-y-1 font-mono text-sm">
      {#each page.error.issues as issue, i (i)}
        <li><span class="text-muted-foreground">{issue.path}:</span> {issue.message}</li>
      {/each}
    </ul>
  {/if}
</main>
