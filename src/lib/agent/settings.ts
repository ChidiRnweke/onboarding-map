import type { Assistant, AssistantProvider, DerivedMap } from '$core/model';
import { mapKey } from '$lib/progress';
import { PROVIDERS } from './providers';

/**
 * Which model the learner's assistant runs on, and the key that pays for it.
 *
 * The key stays in this browser: in localStorage when the learner asks to be
 * remembered on this device, in sessionStorage otherwise, and it is sent only
 * to the provider it belongs to. Storage can be missing or throw (private
 * windows, blocked site data); reads then come back empty and the learner is
 * asked again, which is the right failure for a secret.
 */
export interface AgentSettings {
  provider: AssistantProvider;
  model: string;
  baseURL?: string;
  /** Kept on this device, or only for this browser session. */
  remember: boolean;
}

export interface Connection extends AgentSettings {
  key: string;
}

const name = (map: DerivedMap, what: string) => `onboarding-map:${mapKey(map)}:agent-${what}`;

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string | null): void {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    /* not kept, which only means asking again */
  }
}

const local = () => localStorage;
const session = () => sessionStorage;

/** The author's settings. Every map has the assistant unless it says `enabled: false`. */
export function preset(map: DerivedMap): Assistant | null {
  const a = map.assistant ?? {};
  return a.enabled === false ? null : a;
}

/** Settings the learner saved, else the author's preset, else nothing yet. */
export function loadSettings(map: DerivedMap): AgentSettings | null {
  const stored = read(local, name(map, 'settings')) ?? read(session, name(map, 'settings'));
  if (stored) {
    try {
      const s = JSON.parse(stored) as AgentSettings;
      if (PROVIDERS[s.provider]) return s;
    } catch {
      /* unreadable: start over */
    }
  }
  return null;
}

export function loadKey(map: DerivedMap, provider: AssistantProvider): string {
  return read(local, name(map, `key-${provider}`)) ?? read(session, name(map, `key-${provider}`)) ?? '';
}

export function saveConnection(map: DerivedMap, c: Connection): void {
  const { key, ...settings } = c;
  const [keep, drop] = c.remember ? [local, session] : [session, local];
  write(keep, name(map, 'settings'), JSON.stringify(settings));
  write(drop, name(map, 'settings'), null);
  write(keep, name(map, `key-${c.provider}`), key || null);
  write(drop, name(map, `key-${c.provider}`), null);
}

/** Forgets the key and the choice of model, on this device and in this session. */
export function forget(map: DerivedMap, provider: AssistantProvider): void {
  for (const s of [local, session]) {
    write(s, name(map, 'settings'), null);
    write(s, name(map, `key-${provider}`), null);
  }
}

/** A connection is ready once everything its provider needs is filled in. */
export function isComplete(c: Connection, keyless: boolean): boolean {
  const spec = PROVIDERS[c.provider];
  return spec.needs.every((f) => {
    if (f === 'key') return keyless || c.provider === 'custom' || c.key.trim() !== '';
    if (f === 'baseURL') return URL.canParse(c.baseURL ?? '');
    return c.model.trim() !== '';
  });
}
