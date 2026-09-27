import { existsSync } from 'node:fs';
import { relative } from 'node:path';
import { loadMap } from '../core/load.ts';
import {
  derive,
  routeBacksteps,
  unclaimedPathNodes,
  validate,
  type DerivedMap,
  type OnboardingMap,
  type ValidationIssue,
} from '../core/model.ts';

export interface CheckResult {
  map?: OnboardingMap;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Loads and validates a map. A file that is missing or fails to load is
 * reported as an error rather than thrown, so every command can print it the
 * same way (and the dev server can show it in the page).
 */
export async function check(file: string, { fresh = false } = {}): Promise<CheckResult> {
  if (!existsSync(file)) {
    return { errors: [{ path: relative(process.cwd(), file), message: 'map file not found' }], warnings: [] };
  }
  let map: OnboardingMap;
  try {
    map = await loadMap(file, { fresh });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      errors: [{ path: relative(process.cwd(), file), message: `could not load: ${message}` }],
      warnings: [],
    };
  }
  const errors = validate(map);
  const warnings: ValidationIssue[] = errors.length
    ? []
    : [
        // Route aesthetics, not correctness: a backwards step forces a jump across the map.
        ...routeBacksteps(map).map((message) => ({ path: 'stages', message })),
        ...unclaimedPathNodes(map).map((id) => ({
          path: `nodes.${id}`,
          message: 'on the route, but no goal module is built from it',
        })),
      ];
  return { map, errors, warnings };
}

/** Validation passed, so derivation is safe: every reference resolves. */
export const deriveChecked = (result: CheckResult): DerivedMap => derive(result.map!);
