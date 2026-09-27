/**
 * Durations for the interface's own transitions, honouring the visitor's
 * reduced-motion setting: Svelte transitions, unlike CSS ones, do not.
 */
export function motion(duration: number): number {
  if (typeof matchMedia === 'undefined') return duration;
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
}
