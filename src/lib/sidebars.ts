/**
 * Whether each sidebar was left open, remembered per visitor. Storage can be
 * missing or throw (private windows, blocked site data); both fall back to the
 * default for this screen.
 */
const key = (name: string) => `onboarding-map:${name}-open`;

export function loadOpen(name: string, fallback = true): boolean {
  try {
    const stored = localStorage.getItem(key(name));
    return stored === null ? fallback : stored === 'true';
  } catch {
    return fallback;
  }
}

export function saveOpen(name: string, open: boolean): void {
  try {
    localStorage.setItem(key(name), String(open));
  } catch {
    /* not remembered, which is fine */
  }
}
