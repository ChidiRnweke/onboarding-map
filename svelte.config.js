import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// The published shell is served at a map project's root, so it has no base and
// its asset paths stay absolute (/…). The docs site sets ONBOARDING_BASE to
// mount one copy under /onboarding-map/embed/… ; that copy's asset paths and
// map.json fetch must carry the prefix or they resolve against the domain root.
// Only set `paths` when a base is asked for, so the default build is unchanged.
const base = process.env.ONBOARDING_BASE;

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    // A static shell that loads map.json at runtime; the CLI copies it next to a map.
    adapter: adapter({ pages: 'dist/app', assets: 'dist/app', precompress: false }),
    ...(base ? { paths: { base } } : {}),
    alias: { $core: 'src/core' },
  },
};
