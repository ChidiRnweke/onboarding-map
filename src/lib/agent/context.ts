import type { DerivedMap, MapNode, Stage, StepDetail } from '$core/model';
import type { Anchor } from './actions';

/**
 * What the model is told before it answers: the house rules, the map, where
 * the learner is, and the thing they asked about.
 *
 * The map goes in as an outline (ids, names, one-line summaries, the links
 * between them), which is enough to reason about the route and to point at
 * things. Full detail — a concept's docs, a stage's steps — is one tool call
 * away, so a large map does not fill the model's context before it starts.
 */

/** Where the learner is, as the model needs it. */
export interface Position {
  stage: Stage;
  phase: string;
  step: number;
  selected: string | null;
  read: string[];
}

const oneLine = (text: string, max = 140) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

const stepText = (s: string | StepDetail) => (typeof s === 'string' ? s : s.text);

export function outline(map: DerivedMap): string {
  const lines: string[] = [];
  lines.push(`# ${map.title}`, map.motto);
  if (map.goal) {
    lines.push('', `## Goal: ${map.goal.title}`, oneLine(map.goal.statement, 300));
    for (const m of map.goal.modules) lines.push(`- module ${m.id}: ${m.title} — ${oneLine(m.purpose)}`);
  }
  lines.push('', '## Stages (the route, in order)');
  for (const s of [...map.stages].sort((a, b) => a.order - b.order))
    lines.push(
      `${s.order}. [${s.id}] ${s.title} — ${oneLine(s.task)} (waypoints: ${s.waypoints.join(', ')})`,
    );
  lines.push('', '## Regions');
  for (const d of map.domains) lines.push(`- ${d.id}: ${d.label} — ${oneLine(d.tagline)}`);
  lines.push('', '## Concepts (id | name | kind | status | region: summary)');
  for (const n of map.nodes)
    if (n.kind !== 'category')
      lines.push(`- ${n.id} | ${n.label} | ${n.kind} | ${n.status} | ${n.domain}: ${oneLine(n.summary)}`);
  lines.push('', '## Links (from -kind-> to)');
  for (const e of map.edges) lines.push(`- ${e.from} -${e.label || e.kind}-> ${e.to}`);
  return lines.join('\n');
}

function where(p: Position): string {
  const stepped = p.phase === 'do' || p.phase === 'observe';
  const step = stepped ? p.stage[p.phase as 'do' | 'observe'][p.step] : undefined;
  return [
    `Stage ${p.stage.order} [${p.stage.id}] "${p.stage.title}", phase ${p.phase}` +
      (step ? `, step ${p.step + 1}: ${stepText(step)}` : '') +
      '.',
    `The stage's task: ${p.stage.task}`,
    p.selected ? `Open in the panel: ${p.selected}.` : '',
    p.read.length ? `Already read this stage: ${p.read.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

const nodeBlock = (n: MapNode) =>
  [
    `${n.label} [${n.id}] — ${n.kind}, ${n.status}`,
    n.summary,
    n.alternativeTo ? `An alternative to ${n.alternativeTo}.` : '',
    ...(n.variants ?? []).map((v) => `Variant ${v.label}: ${v.summary}`),
  ]
    .filter(Boolean)
    .join('\n');

/** The thing the learner asked about, in full. */
export function subject(map: DerivedMap, a: Anchor): string {
  const stage = (id: string) => map.stages.find((s) => s.id === id)!;
  switch (a.kind) {
    case 'step': {
      const s = stage(a.stage);
      const step = s[a.phase][a.index];
      const detail = typeof step === 'string' ? { text: step } : step;
      return [
        `A ${a.phase === 'do' ? 'Do' : 'Observe'} step of stage ${s.order} "${s.title}" (step ${a.index + 1} of ${s[a.phase].length}):`,
        detail.text,
        detail.tip ? `The map's own tip for it: ${detail.tip}` : '',
        detail.nodes?.length ? `Concepts it touches: ${detail.nodes.join(', ')}` : '',
        `The stage's task: ${s.task}`,
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'node': {
      const n = map.byId[a.id];
      const near = map.edges
        .filter((e) => e.from === a.id || e.to === a.id)
        .map((e) => `${e.from} -${e.label || e.kind}-> ${e.to}`);
      return [`The concept:`, nodeBlock(n), near.length ? `Its links: ${near.join('; ')}` : ''].join('\n');
    }
    case 'edge': {
      const e = map.edges.find((x) => x.from === a.from && x.to === a.to);
      return [
        `The link: ${a.from} -${e?.label || e?.kind || 'relates to'}-> ${a.to}`,
        nodeBlock(map.byId[a.from]),
        nodeBlock(map.byId[a.to]),
      ].join('\n\n');
    }
    case 'read': {
      const s = stage(a.stage);
      return [
        `The reading for stage ${s.order} "${s.title}":`,
        ...s.read.map((id) => nodeBlock(map.byId[id])),
      ].join('\n\n');
    }
    case 'checkpoint': {
      const s = stage(a.stage);
      return [
        `Stage ${s.order} "${s.title}". Task: ${s.task}`,
        `Checkpoint (how the learner knows they are done): ${s.checkpoint}`,
        `Do: ${s.do.map(stepText).join(' / ')}`,
        s.observe.length ? `Observe: ${s.observe.map(stepText).join(' / ')}` : '',
        `Waypoints: ${s.waypoints.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'module': {
      const m = map.moduleById[a.id];
      return [
        `Goal part "${m.title}" [${m.id}]: ${m.purpose}`,
        `Built from: ${m.builtFrom.join(', ')}`,
        `Produces: ${m.produces.join('; ')}`,
      ].join('\n');
    }
    case 'region': {
      const d = map.domains.find((x) => x.id === a.id)!;
      const groups = map.nodes.filter((n) => n.domain === a.id && n.kind === 'category');
      const items = (group: string) =>
        map.nodes
          .filter((n) => n.parent === group)
          .map((n) => {
            const s = n.stage ? map.stages.find((x) => x.id === n.stage) : undefined;
            return `${n.label} [${n.id}] (${n.status}${s ? `, stage ${s.order}` : ''})`;
          });
      const parts = map.modules.filter((m) => m.builtFrom.some((id) => map.byId[id]?.domain === a.id));
      return [
        `Region "${d.label}" [${d.id}]: ${d.tagline}`,
        d.summary ?? '',
        ...groups.map((g) => `Group ${g.label}: ${items(g.id).join('; ')}`),
        parts.length ? `Goal parts built from it: ${parts.map((m) => m.title).join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'map':
      return '';
  }
}

export function systemPrompt(
  map: DerivedMap,
  position: Position,
  anchor: Anchor,
  instructions?: string,
): string {
  const about = subject(map, anchor);
  return [
    `You are the guide inside an onboarding map: a radial map of a territory with one route through it, walked in stages of do → observe → read. You help one learner along that route.`,
    `How to answer:
- Be brief and concrete: a few short paragraphs or a short list. The learner is in the middle of doing something.
- Ground every answer in the map. When you go beyond what the map says, say so ("the map does not cover this; generally…").
- Do not invent commands, file names or URLs the map does not give. If you are unsure, say what to check.
- Show, don't list ids: when concepts matter, call point_at so they light up on the map, or open_node for the one to read next. Never write raw ids in your text; use names.
- You can read more with get_node, get_stage and search_map before answering.
- Moving the learner (go_to_stage) is for when they ask to go somewhere, not to answer a question.
- Progress is the learner's: to mark something read or a step done, call propose_progress; they decide.`,
    instructions ? `From the map's author:\n${instructions}` : '',
    `## Where the learner is\n${where(position)}`,
    about ? `## What they are asking about\n${about}` : '',
    `## The map\n${outline(map)}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
