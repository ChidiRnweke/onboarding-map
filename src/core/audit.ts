import type { DocLink, OnboardingMap, Ref } from './model.ts';

/**
 * Signals that content may be stale or unfinished. Unlike validation errors
 * these never block a build; they are a to-do list for a person or an agent.
 */
export type FindingKind = 'todo-link' | 'dead-link' | 'no-docs' | 'no-refs' | 'source-newer' | 'unread';

export interface Finding {
  kind: FindingKind;
  path: string;
  message: string;
  url?: string;
}

export interface AuditOptions {
  /** ISO date the map file last changed; stands in for `SourceDocument.reviewed`. */
  lastChanged?: string;
  /** Request every documentation URL and report the ones that fail. */
  checkUrls?: boolean;
  /** For tests and offline runs. */
  fetch?: typeof fetch;
}

export async function audit(map: OnboardingMap, options: AuditOptions = {}): Promise<Finding[]> {
  const findings: Finding[] = [];
  const add = (kind: FindingKind, path: string, message: string, url?: string) =>
    findings.push({ kind, path, message, ...(url ? { url } : {}) });

  // Every documentation link, with where it lives.
  const links: { path: string; link: DocLink }[] = [];
  for (const n of map.nodes) {
    for (const link of n.docs ?? []) links.push({ path: `nodes.${n.id}`, link });
    for (const v of n.variants ?? [])
      for (const link of v.docs ?? []) links.push({ path: `nodes.${n.id}.variants.${v.label}`, link });
  }

  for (const { path, link } of links)
    if (link.url === 'TODO') add('todo-link', path, `link “${link.title}” has no URL yet`);
  for (const d of map.documents ?? [])
    if (d.url === 'TODO')
      add('todo-link', `documents.${d.id}`, `source document “${d.title}” has no URL yet`);

  for (const n of map.nodes)
    if (n.kind !== 'category' && n.status !== 'context' && !n.docs?.length)
      add('no-docs', `nodes.${n.id}`, `${n.status} item “${n.label}” has no documentation links`);

  // Provenance only matters once the map cites documents at all.
  if (map.documents?.length) {
    for (const n of map.nodes)
      if (n.status === 'path' && n.kind !== 'category' && !n.refs?.length)
        add('no-refs', `nodes.${n.id}`, `route item “${n.label}” does not say which document it comes from`);
    for (const s of map.stages)
      if (!s.refs?.length)
        add('no-refs', `stages.${s.id}`, `stage “${s.title}” does not say which document it comes from`);
  }

  // Documents that changed after the content citing them was last checked.
  const citing = new Map<string, string[]>();
  const cite = (path: string, refs?: Ref[]) => {
    for (const r of refs ?? []) citing.set(r.doc, [...(citing.get(r.doc) ?? []), path]);
  };
  for (const n of map.nodes) cite(`nodes.${n.id}`, n.refs);
  for (const s of map.stages) cite(`stages.${s.id}`, s.refs);
  for (const m of map.goal?.modules ?? []) cite(`goal.modules.${m.id}`, m.refs);
  for (const d of map.documents ?? []) {
    const checked = d.reviewed ?? options.lastChanged;
    if (!d.date || !checked || d.date <= checked) continue;
    const paths = citing.get(d.id) ?? [];
    add(
      'source-newer',
      `documents.${d.id}`,
      `“${d.title}” is dated ${d.date}, after the content was last checked (${checked}); ` +
        `review ${paths.length} item${paths.length === 1 ? '' : 's'} citing it: ${paths.join(', ') || 'none'}`,
    );
  }

  // Route items a learner is never pointed to read.
  const read = new Set(map.stages.flatMap((s) => [...s.read, ...s.waypoints]));
  for (const n of map.nodes)
    if (n.status === 'path' && n.kind !== 'category' && !read.has(n.id))
      add('unread', `nodes.${n.id}`, `route item “${n.label}” is not a waypoint or in any stage's Read`);

  if (options.checkUrls) {
    const doFetch = options.fetch ?? fetch;
    const unique = [...new Set(links.map((l) => l.link.url).filter((u) => /^https?:\/\//.test(u)))];
    const failed = new Map<string, string>();
    let next = 0;
    const worker = async () => {
      while (next < unique.length) {
        const url = unique[next++];
        const problem = await checkUrl(url, doFetch);
        if (problem) failed.set(url, problem);
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    for (const { path, link } of links) {
      const problem = failed.get(link.url);
      if (problem) add('dead-link', path, `link “${link.title}” ${problem}`, link.url);
    }
  }
  return findings;
}

/** Undefined when the URL answers; otherwise what went wrong. */
async function checkUrl(url: string, doFetch: typeof fetch): Promise<string | undefined> {
  const attempt = (method: string) =>
    doFetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15_000) });
  try {
    let res = await attempt('HEAD');
    // Plenty of servers refuse HEAD or bots; a GET settles it.
    if (res.status >= 400) res = await attempt('GET');
    return res.status >= 400 ? `returns HTTP ${res.status}` : undefined;
  } catch (e) {
    return `could not be reached (${e instanceof Error ? e.message : String(e)})`;
  }
}
