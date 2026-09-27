#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';

/*
 * Builds the live maps the docs embed, one per example, and copies each source
 * file next to the built site so the Examples pages can show the map and the
 * data that made it, side by side.
 *
 * Each embed is served from its own path under the docs' base, and the map
 * shell resolves its assets and map.json from that base, so each one needs a
 * build of its own with ONBOARDING_BASE set to its mount path.
 */

const EXAMPLES = [
  { name: 'starter', map: 'templates/starter.ts' },
  { name: 'physics', map: 'templates/physics.ts' },
  { name: 'project', map: 'examples/onboarding-map.ts' },
];

const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

mkdirSync('docs/public/examples', { recursive: true });

for (const { name, map } of EXAMPLES) {
  const base = `/onboarding-map/embed/${name}`;
  run('npm', ['run', 'build'], { ONBOARDING_BASE: base });
  run('node', ['dist/cli/index.js', 'build', '--map', map, '--out', `docs/public/embed/${name}`]);
  copyFileSync(map, `docs/public/examples/${name}.ts`);
  console.log(`✓ ${name}: ${base}/ and docs/public/examples/${name}.ts`);
}
