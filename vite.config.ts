import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { check, deriveChecked } from './src/cli/check.ts';

/**
 * While working on the app itself, serve /map.json the way `onboarding-map dev`
 * does, from ONBOARDING_MAP (default: the physics template). Built output has no
 * map; the CLI puts one next to it.
 */
function devMap(): Plugin {
  const file = resolve(process.env.ONBOARDING_MAP ?? 'templates/physics.ts');
  return {
    name: 'onboarding-map:dev-map',
    configureServer(server) {
      server.watcher.add(file);
      server.watcher.on('change', (changed) => {
        if (changed === file) server.ws.send({ type: 'full-reload' });
      });
      server.middlewares.use('/map.json', async (_req, res) => {
        const result = await check(file, { fresh: true });
        res.setHeader('content-type', 'application/json');
        if (result.errors.length) {
          res.statusCode = 422;
          return res.end(JSON.stringify({ message: 'The map has problems', issues: result.errors }));
        }
        res.end(JSON.stringify(deriveChecked(result)));
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), devMap()],
});
