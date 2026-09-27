<script lang="ts">
  import MapApp from '$lib/components/MapApp.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.map.labels.pageTitle || data.map.title}</title>
</svelte:head>

<MapApp map={data.map} />
