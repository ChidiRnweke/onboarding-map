import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The installed package: dist/cli/ is two levels below it. */
export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const APP_DIR = join(PACKAGE_ROOT, 'dist/app');
export const SKILLS_DIR = join(PACKAGE_ROOT, 'skills');
export const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');
export const SCHEMA_FILE = join(PACKAGE_ROOT, 'schema/map.schema.json');
export const VERSION: string = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version;

export const CONFIG_FILE = 'onboarding-map.config.json';

export interface Config {
  /** The map file, relative to the config. */
  map: string;
  /** Where `build` writes the site. */
  out: string;
}

const DEFAULT_MAPS = ['map.ts', 'map.json', 'map.js'];

/**
 * Settings for a project: `--map`/`--out` win over onboarding-map.config.json,
 * which wins over the defaults (the first of map.ts, map.json, map.js; ./dist).
 */
export function resolveConfig(cwd: string, flags: { map?: string; out?: string }): Config {
  const file = join(cwd, CONFIG_FILE);
  const fromFile: Partial<Config> = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const map =
    flags.map ?? fromFile.map ?? DEFAULT_MAPS.find((m) => existsSync(join(cwd, m))) ?? DEFAULT_MAPS[0];
  return { map: resolve(cwd, map), out: resolve(cwd, flags.out ?? fromFile.out ?? 'dist') };
}
