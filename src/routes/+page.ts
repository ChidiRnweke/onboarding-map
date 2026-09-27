import { error } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { DerivedMap, ValidationIssue } from '$core/model';

// The page is a shell: the map it shows is `map.json` next to it, written by
// `onboarding-map build` (or served by `onboarding-map dev`). The shell is
// prerendered once and works for any map, so nothing here runs on a server.
export const prerender = true;
export const ssr = false;

export async function load({ fetch }) {
  const res = await fetch(`${base}/map.json`, { cache: 'no-cache' });
  if (!res.ok) {
    // The dev server answers with the validation issues when the map is invalid.
    const body = await res.json().catch(() => ({}));
    const issues: ValidationIssue[] = body.issues ?? [];
    error(res.status, { message: body.message ?? `Could not load map.json (HTTP ${res.status})`, issues });
  }
  return { map: (await res.json()) as DerivedMap };
}
