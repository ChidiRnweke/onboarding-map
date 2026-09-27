<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import BookOpenCheckIcon from '@lucide/svelte/icons/book-open-check';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import CrosshairIcon from '@lucide/svelte/icons/crosshair';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import SearchIcon from '@lucide/svelte/icons/search';
  import { getAgent } from '$lib/agent/agent.svelte';
  import type { Touched } from '$lib/agent/tools';

  /**
   * One thing an answer touched on the map, stated as a fact about that thing:
   * "Opened · Git", not "open_node completed". Reads are named but quiet; moves
   * lead to where they went; a proposal waits for the learner's answer in the
   * row itself.
   */
  let { item }: { item: Touched } = $props();

  const agent = getAgent();
  const labels = $derived(agent.map.labels.agent);

  const icons = {
    get_node: FileTextIcon,
    get_stage: FileTextIcon,
    search_map: SearchIcon,
    open_node: ArrowUpRightIcon,
    go_to_stage: MapPinIcon,
    point_at: CrosshairIcon,
    propose_progress: BookOpenCheckIcon,
  };
  const Icon = $derived(item.state === 'failed' ? CircleAlertIcon : icons[item.tool]);

  const verb = $derived(
    item.state === 'failed'
      ? `${item.verb[0]}: not found`
      : item.state === 'proposed'
        ? `${item.verb[0]}?`
        : item.state === 'declined'
          ? 'Declined'
          : item.state === 'running'
            ? item.verb[0]
            : item.verb[1],
  );

  function go() {
    const t = item.target;
    if (!t) return;
    if ('node' in t) agent.app.select(t.node);
    else agent.app.goto(t.stage);
  }
</script>

<li
  class="type-small flex min-w-0 items-center gap-2 py-0.5 {item.quiet || item.state === 'declined'
    ? 'text-muted'
    : 'text-ink-2'}"
>
  {#if item.state === 'running'}
    <LoaderCircleIcon size={13} class="flex-none animate-spin" />
  {:else}
    <Icon size={13} class="flex-none {item.state === 'failed' ? 'text-muted' : ''}" />
  {/if}
  <span class="flex-none">{verb}</span>
  {#if item.target && item.state !== 'failed'}
    <button
      class="min-w-0 cursor-pointer truncate border-0 bg-transparent p-0 font-semibold text-inherit underline-offset-2 hover:text-route hover:underline"
      onclick={go}>{item.subject}</button
    >
  {:else}
    <span class="min-w-0 truncate font-semibold">{item.subject}</span>
  {/if}
  {#if item.state === 'proposed'}
    <span class="ml-auto flex flex-none gap-1">
      <button
        class="cursor-pointer rounded-full border border-route bg-route px-2.5 py-0.5 text-paper"
        onclick={() => agent.decide(item, true)}>{labels.accept}</button
      >
      <button
        class="cursor-pointer rounded-full border border-rule bg-transparent px-2.5 py-0.5 text-ink-2 hover:border-ink-2"
        onclick={() => agent.decide(item, false)}>{labels.decline}</button
      >
    </span>
  {/if}
</li>
