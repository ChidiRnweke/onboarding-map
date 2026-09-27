<script lang="ts">
  import '@fontsource-variable/archivo/wdth.css';
  import '@fontsource-variable/newsreader/opsz.css';
  import '@fontsource-variable/newsreader/opsz-italic.css';
  import { ModeWatcher } from 'mode-watcher';
  import '../app.css';

  let { children } = $props();
</script>

<!-- Adds .dark or .light to <html> before first paint; "system" until the
     visitor picks one with the toggle. .light lets the stylesheet's OS fallback
     step aside for an explicit choice. -->
<ModeWatcher lightClassNames={['light']} />
{@render children()}
