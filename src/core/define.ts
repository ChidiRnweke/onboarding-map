import type { DocLink, OnboardingMap, Ref } from './model.ts';

/**
 * Identity function that gives a map written in TypeScript its types:
 *   export default defineMap({ title: '…', … });
 */
export const defineMap = (map: OnboardingMap): OnboardingMap => map;

/**
 * Makes a doc-link helper for one source, so links stay readable:
 *   const learn = docLink('microsoft-learn', 'https://learn.microsoft.com/en-us/');
 *   learn('Resource groups', 'azure/azure-resource-manager/…')
 */
export const docLink =
  (source: string, base = '') =>
  (title: string, path: string): DocLink => ({ title, url: `${base}${path}`, source });

/** A link that still needs a real URL: `todoLink('internal')('Team wiki')`. `audit` lists them. */
export const todoLink =
  (source: string) =>
  (title: string): DocLink => ({ title, url: 'TODO', source });

/** ref('terraform', 3, 40) → slides 3 and 40 of the document with id 'terraform'. */
export const ref = (doc: string, ...slides: number[]): Ref => (slides.length ? { doc, slides } : { doc });
