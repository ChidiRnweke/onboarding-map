<script lang="ts">
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import { toggleMode } from 'mode-watcher';
  import { Button } from '$lib/components/shadcn/button/index.js';
</script>

<Button onclick={toggleMode} variant="outline" size="icon" aria-label="Toggle theme" title="Toggle theme">
  <SunIcon class="scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90" />
  <MoonIcon class="absolute scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0" />
</Button>
