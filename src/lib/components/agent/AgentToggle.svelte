<script lang="ts">
  import CompassIcon from '@lucide/svelte/icons/compass';
  import { Button } from '$lib/components/shadcn/button/index.js';
  import { getAgent } from '$lib/agent/agent.svelte';

  // The one free-form way in: the assistant's own view, next to the theme toggle.
  const agent = getAgent();
  const label = $derived(agent.map.labels.agent.ask);
</script>

{#if agent.enabled}
  <Button
    variant={agent.app.agentOpen ? 'default' : 'outline'}
    size="icon"
    aria-label={label}
    title={label}
    aria-pressed={agent.app.agentOpen}
    onclick={() => agent.app.setAgentOpen(!agent.app.agentOpen)}
  >
    <CompassIcon />
  </Button>
{/if}
