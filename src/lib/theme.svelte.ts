import { color } from 'd3-color';
import { mode } from 'mode-watcher';
import { getContext, setContext } from 'svelte';
import type { DerivedMap } from '$core/model';

/**
 * Tracks whether the page is being shown dark, so region colours can be derived
 * to suit. Reads mode-watcher, which resolves the visitor's toggle choice or the
 * OS preference; before it has run (SSR) the light palette is used.
 */
export class Theme {
  #hueOf: Record<string, string>;

  constructor(map: DerivedMap) {
    this.#hueOf = Object.fromEntries(map.domains.map((d) => [d.id, d.color]));
  }

  get dark(): boolean {
    return mode.current === 'dark';
  }

  /** Base hue of a region, adjusted for the current theme. */
  tone(domainId: string): string {
    const c = color(this.#hueOf[domainId]);
    if (!c) return this.#hueOf[domainId];
    return (this.dark ? c.brighter(0.55) : c.darker(0.15)).formatHex();
  }
}

const KEY = Symbol('onboarding-map-theme');

export function setTheme(map: DerivedMap): Theme {
  return setContext(KEY, new Theme(map));
}

export function getTheme(): Theme {
  return getContext<Theme>(KEY);
}
