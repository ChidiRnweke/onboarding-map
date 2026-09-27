/**
 * What a learner has done, remembered in their own browser: where they were in
 * each stage, what they have read, the notes they wrote and whether they have
 * seen the big picture. Storage can be missing or throw (private windows,
 * blocked site data); every read then falls back and every write is dropped,
 * and the app works the same, only without memory.
 */

export type Phase = 'brief' | 'do' | 'observe' | 'read' | 'done';
export const PHASES: Phase[] = ['brief', 'do', 'observe', 'read', 'done'];

export interface StageProgress {
  phase: Phase;
  /** Position within the phase's items, 0-based. */
  step: number;
  /** Node ids opened from Read. */
  read: string[];
  /** Notes keyed by `${phase}:${index}`. */
  notes: Record<string, string>;
}

export const emptyProgress = (): StageProgress => ({ phase: 'brief', step: 0, read: [], notes: {} });

const key = (map: string, name: string) => `onboarding-map:${map}:${name}`;

/** What progress is stored under, so two maps in one browser stay apart. */
export const mapKey = (map: { id?: string; title: string }) => map.id ?? map.title;

export function load<T>(map: string, name: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key(map, name));
    return stored === null ? fallback : (JSON.parse(stored) as T);
  } catch {
    return fallback;
  }
}

export function save(map: string, name: string, value: unknown): void {
  try {
    localStorage.setItem(key(map, name), JSON.stringify(value));
  } catch {
    /* not remembered, which is fine */
  }
}

/** `#provision/do/3` → where to open. Steps are 1-based in the address, as people count them. */
export function parseHash(hash: string): { stage: string; phase?: Phase; step?: number } | null {
  const [stage, phase, step] = hash.replace(/^#\/?/, '').split('/');
  if (!stage) return null;
  return {
    stage: decodeURIComponent(stage),
    phase: PHASES.includes(phase as Phase) ? (phase as Phase) : undefined,
    step: step && /^\d+$/.test(step) ? Math.max(0, Number(step) - 1) : undefined,
  };
}

export function toHash(stage: string, phase: Phase, step: number, stepped: boolean): string {
  const base = `#${encodeURIComponent(stage)}`;
  if (phase === 'brief') return base;
  return stepped ? `${base}/${phase}/${step + 1}` : `${base}/${phase}`;
}
