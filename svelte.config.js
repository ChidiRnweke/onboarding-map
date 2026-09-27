import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    // A static shell that loads map.json at runtime; the CLI copies it next to a map.
    adapter: adapter({ pages: 'dist/app', assets: 'dist/app', precompress: false }),
    alias: { $core: 'src/core' },
  },
};
