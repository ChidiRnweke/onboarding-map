import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { OnboardingMap } from './model.ts';

/**
 * Reads a map from a `.json` file or a `.ts`/`.js` module. Modules are imported
 * by Node itself, which strips TypeScript types (Node ≥ 22.18), so a map file
 * may import helpers from 'onboarding-map' or from neighbouring files.
 *
 * `fresh` bypasses the module cache so a dev server sees edits. Only the map
 * file itself is re-read; files it imports stay cached until restart.
 */
export async function loadMap(file: string, { fresh = false } = {}): Promise<OnboardingMap> {
  const abs = resolve(file);
  if (extname(abs) === '.json') return JSON.parse(readFileSync(abs, 'utf8')) as OnboardingMap;
  const url = pathToFileURL(abs).href + (fresh ? `?t=${Date.now()}` : '');
  return pickMap(await import(url), file);
}

/** The default export, or the only export that looks like a map. */
function pickMap(mod: Record<string, unknown>, file: string): OnboardingMap {
  if (isMap(mod.default)) return mod.default;
  const maps = Object.values(mod).filter(isMap);
  if (maps.length === 1) return maps[0];
  throw new Error(`${file}: expected a default export with the map (export default defineMap({ … }))`);
}

const isMap = (v: unknown): v is OnboardingMap =>
  typeof v === 'object' && v !== null && 'nodes' in v && 'stages' in v && 'domains' in v;

/**
 * Loads the map as it was at a git revision. `rev` is a commit-ish, and the
 * file is the same path as `file`; `rev:path` (git's own syntax, path from the
 * repository root) reads a file that has since moved.
 *
 * The old content is written next to `file` for the duration of the import,
 * so its relative imports and 'onboarding-map' resolve as they do today.
 */
export async function loadMapAt(file: string, rev: string): Promise<OnboardingMap> {
  const abs = resolve(file);
  const cwd = dirname(abs);
  const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' });
  let spec = rev;
  if (!rev.includes(':')) {
    const root = git('rev-parse', '--show-toplevel').trim();
    spec = `${rev}:${relative(root, abs).split('\\').join('/')}`;
  }
  const content = git('show', spec);
  const ext = extname(spec) || extname(abs);
  const tmp = join(cwd, `.${basename(abs, extname(abs))}.at-${process.pid}${ext}`);
  writeFileSync(tmp, content);
  try {
    return await loadMap(tmp);
  } finally {
    unlinkSync(tmp);
  }
}

/** ISO date of the last commit that touched `file`, or undefined outside git. */
export function lastChanged(file: string): string | undefined {
  try {
    const abs = resolve(file);
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', abs], {
      cwd: dirname(abs),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}
