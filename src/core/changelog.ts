import type { MapNode, OnboardingMap, Ref, Step } from './model.ts';

/**
 * What changed between two versions of a map, as Markdown a reviewer can read
 * without opening a diff: added and removed items, re-classifications,
 * rewritten text (before and after), link changes, stages and the goal.
 * Sections without changes are left out.
 */
export function changelog(
  before: OnboardingMap,
  after: OnboardingMap,
): { markdown: string; changed: boolean } {
  const out: string[] = [];
  const line = (s = '') => out.push(s);
  const section = (title: string, lines: string[]) => {
    if (!lines.length) return;
    line(`## ${title}`);
    lines.forEach((l) => line(l));
    line();
  };

  const docTitle = (id: string) => after.documents?.find((d) => d.id === id)?.title ?? id;
  const refText = (refs?: Ref[]) =>
    (refs ?? [])
      .map((r) => `${docTitle(r.doc)}${r.slides ? ` (slides ${r.slides.join(', ')})` : ''}`)
      .join('; ');
  const from = (refs?: Ref[]) => (refText(refs) ? ` — from ${refText(refs)}` : '');
  const leaf = (n: MapNode) => n.kind !== 'category';
  const stepText = (s: Step) => (typeof s === 'string' ? s : s.text);
  const listDiff = (a: string[], b: string[]) => {
    const was = new Set(a),
      now = new Set(b);
    return [
      ...b.filter((x) => !was.has(x)).map((x) => `+ ${x}`),
      ...a.filter((x) => !now.has(x)).map((x) => `− ${x}`),
    ];
  };

  line(`# ${after.title}: v${before.version} → v${after.version}`);
  line();

  // Regions
  const bd = new Map(before.domains.map((d) => [d.id, d])),
    ad = new Map(after.domains.map((d) => [d.id, d]));
  section('Regions', [
    ...after.domains.filter((d) => !bd.has(d.id)).map((d) => `- New: **${d.label}**: ${d.tagline}`),
    ...before.domains.filter((d) => !ad.has(d.id)).map((d) => `- Removed: ${d.label}`),
    ...after.domains
      .filter((d) => bd.has(d.id) && bd.get(d.id)!.label !== d.label)
      .map((d) => `- Renamed: ${bd.get(d.id)!.label} → ${d.label}`),
  ]);

  // Nodes
  const bn = new Map(before.nodes.map((n) => [n.id, n])),
    an = new Map(after.nodes.map((n) => [n.id, n]));
  const added = after.nodes.filter((n) => !bn.has(n.id));
  const addedLines: string[] = [];
  for (const d of after.domains) {
    const here = added.filter((n) => n.domain === d.id);
    if (!here.length) continue;
    addedLines.push(`### ${d.label}`);
    for (const n of here)
      addedLines.push(
        `- **${n.label}** (${n.kind === 'category' ? 'category' : n.status}${n.stage ? `, stage ${n.stage}` : ''})${from(n.refs)}`,
      );
  }
  section(`Added nodes (${added.length})`, addedLines);

  const removed = before.nodes.filter((n) => !an.has(n.id));
  section(
    `Removed nodes (${removed.length})`,
    removed.map((n) => `- ${n.label} (${n.id})`),
  );

  const kept = after.nodes.filter((n) => bn.has(n.id));
  section(
    'Moved or re-classified',
    kept.flatMap((n) => {
      const o = bn.get(n.id)!;
      const parts: string[] = [];
      if (o.status !== n.status) parts.push(`${o.status} → ${n.status}`);
      if (o.stage !== n.stage) parts.push(`stage ${o.stage ?? '–'} → ${n.stage ?? '–'}`);
      if (o.domain !== n.domain) parts.push(`region ${o.domain} → ${n.domain}`);
      if (o.parent !== n.parent) parts.push(`group ${o.parent ?? '–'} → ${n.parent ?? '–'}`);
      return parts.length ? [`- **${n.label}**: ${parts.join(', ')}`] : [];
    }),
  );

  const rewritten = kept
    .filter(leaf)
    .filter((n) => bn.get(n.id)!.summary !== n.summary || bn.get(n.id)!.label !== n.label);
  section(
    `Rewritten summaries (${rewritten.length})`,
    rewritten.flatMap((n) => {
      const o = bn.get(n.id)!;
      return [
        `- **${n.label}**${o.label !== n.label ? ` (was “${o.label}”)` : ''}${from(n.refs)}`,
        ...(o.summary !== n.summary ? [`  - before: ${o.summary}`, `  - after: ${n.summary}`] : []),
      ];
    }),
  );

  const urls = (n?: MapNode) => (n?.docs ?? []).map((d) => d.url);
  const linkChanges = kept.filter((n) => urls(bn.get(n.id)).join('|') !== urls(n).join('|'));
  section(
    `Documentation links changed (${linkChanges.length} existing nodes)`,
    linkChanges.map(
      (n) => `- **${n.label}**: ${listDiff(urls(bn.get(n.id)), urls(n)).join(', ') || 'reordered'}`,
    ),
  );

  // Edges
  const edgeKey = (e: OnboardingMap['edges'][number]) => `${e.from} ${e.kind.replace(/-/g, ' ')} ${e.to}`;
  section(
    'Connections',
    listDiff(before.edges.map(edgeKey), after.edges.map(edgeKey)).map((l) => `- ${l}`),
  );

  // Stages
  const stageLines: string[] = [];
  for (const s of after.stages) {
    const o = before.stages.find((x) => x.id === s.id);
    if (!o) {
      stageLines.push(`- New stage: **${s.order}. ${s.title}**`);
      continue;
    }
    const diffs: string[] = [];
    if (o.title !== s.title) diffs.push(`  - title: was “${o.title}”`);
    if (o.order !== s.order) diffs.push(`  - order: ${o.order} → ${s.order}`);
    for (const k of ['do', 'observe'] as const) {
      const d = listDiff(o[k].map(stepText), s[k].map(stepText));
      if (d.length) diffs.push(`  - ${k}: ${d.join(' | ')}`);
    }
    for (const k of ['read', 'waypoints'] as const) {
      const d = listDiff(o[k], s[k]);
      if (d.length) diffs.push(`  - ${k}: ${d.join(' | ')}`);
    }
    if (o.task !== s.task) diffs.push(`  - task: ${s.task}`);
    if (o.feeling !== s.feeling) diffs.push(`  - feeling: ${s.feeling}`);
    if (o.checkpoint !== s.checkpoint) diffs.push(`  - checkpoint: ${s.checkpoint}`);
    if (diffs.length) stageLines.push(`- **${s.order}. ${s.title}**`, ...diffs);
  }
  for (const o of before.stages)
    if (!after.stages.some((s) => s.id === o.id)) stageLines.push(`- Removed stage: ${o.title}`);
  section('Stages', stageLines);

  // Goal
  const goalLines: string[] = [];
  if (before.goal?.statement !== after.goal?.statement)
    goalLines.push(`- statement: ${after.goal?.statement ?? '–'}`);
  for (const m of after.goal?.modules ?? []) {
    const o = before.goal?.modules.find((x) => x.id === m.id);
    if (!o) {
      goalLines.push(`- New part: **${m.title}**`);
      continue;
    }
    const d = listDiff(o.builtFrom, m.builtFrom);
    if (d.length) goalLines.push(`- **${m.title}** made of: ${d.join(', ')}`);
    if (o.purpose !== m.purpose) goalLines.push(`- **${m.title}** purpose: ${m.purpose}`);
  }
  for (const o of before.goal?.modules ?? [])
    if (!after.goal?.modules.some((m) => m.id === o.id)) goalLines.push(`- Removed part: ${o.title}`);
  section('Goal', goalLines);

  // Source documents
  const bdocs = new Map((before.documents ?? []).map((d) => [d.id, d]));
  section(
    'Source documents',
    (after.documents ?? []).flatMap((d) => {
      const o = bdocs.get(d.id);
      if (!o) return [`- New: ${d.title}${d.date ? ` (${d.date})` : ''}`];
      if (o.date !== d.date || o.url !== d.url || o.title !== d.title)
        return [`- Updated: ${d.title}${d.date ? ` (${d.date})` : ''}`];
      return [];
    }),
  );

  const changed = out.length > 2;
  if (!changed) line('No content changes.');
  line();
  line(
    `Totals: ${before.nodes.filter(leaf).length} → ${after.nodes.filter(leaf).length} leaf nodes, ` +
      `${before.edges.length} → ${after.edges.length} edges, ${before.domains.length} → ${after.domains.length} regions, ` +
      `${before.stages.length} → ${after.stages.length} stages.`,
  );
  return { markdown: out.join('\n') + '\n', changed };
}
