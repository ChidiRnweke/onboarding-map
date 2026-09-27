import { Type, type Tool } from '@earendil-works/pi-ai';
import type { DerivedMap } from '$core/model';
import type { AppState } from '$lib/state.svelte';

/**
 * What the assistant can do on the map.
 *
 * Every tool is a thin wrapper over something the learner can already do
 * through AppState: the assistant opens a concept the way a click does and
 * moves between stages the way the pager does. Nothing here is a capability of
 * its own. `COVERAGE` classifies every AppState method, and its type makes an
 * unclassified one a compile error, so a new action on the map has to be
 * decided on for the assistant too.
 *
 *  - read      runs freely; it changes nothing
 *  - navigate  moves the map or the panel; the thread offers the way back
 *  - propose   changes the learner's progress, so the learner decides
 *  - excluded  kept from the assistant, with the reason next to it
 */
type Methods<T> = { [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never }[keyof T];

type Coverage =
  | { class: 'read' | 'navigate' | 'propose'; tool: ToolName }
  | { class: 'read'; tool?: undefined; why: string }
  | { class: 'excluded'; why: string };

export const COVERAGE = {
  stagesOf: { class: 'read', tool: 'get_stage' },
  moduleOf: { class: 'read', tool: 'get_stage' },
  moduleState: { class: 'read', why: 'Where a goal part stands is in the outline the model is given.' },
  moduleStateAt: { class: 'read', why: 'As moduleState.' },
  moduleProgress: { class: 'read', why: 'Drawing detail, not something to reason about.' },
  visible: { class: 'read', why: 'Whether the focused view shows a node; pointing at one reveals it.' },
  known: { class: 'read', why: 'Fog of the journey; the model is told the stage instead.' },
  steps: { class: 'read', tool: 'get_stage' },
  itemCount: { class: 'read', tool: 'get_stage' },
  note: {
    class: 'excluded',
    why: "Notes are the learner's: one is sent only when they ask to check it (StageSteps), never read by a tool.",
  },
  select: { class: 'navigate', tool: 'open_node' },
  goto: { class: 'navigate', tool: 'go_to_stage' },
  setPhase: { class: 'navigate', tool: 'go_to_stage' },
  pointAt: { class: 'navigate', tool: 'point_at' },
  markRead: { class: 'propose', tool: 'propose_progress' },
  forward: { class: 'propose', tool: 'propose_progress' },
  back: {
    class: 'excluded',
    why: 'Going back a step is the learner’s call; go_to_stage covers moving on request.',
  },
  complete: {
    class: 'excluded',
    why: 'Closing a stage is a milestone the learner marks, not the assistant.',
  },
  nextRead: {
    class: 'excluded',
    why: 'Part of the reading tour the learner walks; markRead covers progress.',
  },
  setNote: { class: 'excluded', why: "Writing in the learner's notes would put words in their mouth." },
  restore: { class: 'excluded', why: 'Page start-up.' },
  selectModule: {
    class: 'excluded',
    why: 'Goal parts are explained where they are open; open_node covers moving.',
  },
  selectPeriod: { class: 'excluded', why: 'An overview the learner browses.' },
  selectRegion: {
    class: 'excluded',
    why: 'An overview the learner browses; point_at shows a region’s nodes.',
  },
  selectKind: { class: 'excluded', why: 'An overview the learner browses.' },
  setAgentOpen: { class: 'excluded', why: "The assistant's own view." },
  snapshot: { class: 'excluded', why: 'Taken around every move, so the learner can go back.' },
  returnTo: { class: 'excluded', why: 'The learner’s way back, offered after a move.' },
  showPanel: { class: 'excluded', why: 'Layout, not the map.' },
  setView: { class: 'excluded', why: 'Layout; point_at switches the view when it must.' },
  toggleShowAll: { class: 'excluded', why: 'Layout.' },
} as const satisfies Record<Methods<AppState>, Coverage>;

export type ToolName =
  'get_node' | 'get_stage' | 'search_map' | 'open_node' | 'go_to_stage' | 'point_at' | 'propose_progress';

export const TOOLS: Tool[] = [
  {
    name: 'get_node',
    description: "A concept's full entry: summary, links, docs, and the stage it is on.",
    parameters: Type.Object({ id: Type.String({ description: 'Concept id from the map outline' }) }),
  },
  {
    name: 'get_stage',
    description:
      "A stage's full content: its Do and Observe steps with their tips, what to read, and its checkpoint.",
    parameters: Type.Object({ order: Type.Integer({ minimum: 1, description: 'Stage number, 1-based' }) }),
  },
  {
    name: 'search_map',
    description: 'Concepts whose name, summary or tags match the words, best first.',
    parameters: Type.Object({ query: Type.String() }),
  },
  {
    name: 'open_node',
    description: 'Open one concept in the panel and move the map to it, for the learner to read next.',
    parameters: Type.Object({ id: Type.String() }),
  },
  {
    name: 'go_to_stage',
    description:
      'Take the learner to a stage, optionally to a phase within it. Only when they ask to go there.',
    parameters: Type.Object({
      order: Type.Integer({ minimum: 1 }),
      phase: Type.Optional(
        Type.Union([
          Type.Literal('brief'),
          Type.Literal('do'),
          Type.Literal('observe'),
          Type.Literal('read'),
        ]),
      ),
    }),
  },
  {
    name: 'point_at',
    description:
      'Light up concepts on the map, with a short caption saying why (under 60 characters). The way to show what you are talking about.',
    parameters: Type.Object({
      ids: Type.Array(Type.String(), { minItems: 1, maxItems: 8 }),
      caption: Type.String({ maxLength: 80 }),
    }),
  },
  {
    name: 'propose_progress',
    description:
      "Offer to record progress: 'mark_read' ticks a concept off this stage's reading; 'next_step' moves on to the next step. The learner accepts or declines.",
    parameters: Type.Object({
      action: Type.Union([Type.Literal('mark_read'), Type.Literal('next_step')]),
      id: Type.Optional(Type.String({ description: "Concept id, for 'mark_read'" })),
    }),
  },
];

/** What a call did, as the thread shows it: the thing touched and a verb. */
export interface Touched {
  id: string;
  tool: ToolName;
  /** Present tense while it runs ("Open"), past once done ("Opened"). */
  verb: [string, string];
  /** The name of the thing, as the learner knows it. */
  subject: string;
  /** Where the row leads when pressed. */
  target?: { node: string } | { stage: number };
  state: 'running' | 'done' | 'failed' | 'proposed' | 'accepted' | 'declined';
  /** A read: named, but quiet. */
  quiet?: boolean;
  /** For a proposal: what accepting does. */
  proposal?: { action: 'mark_read' | 'next_step'; id?: string };
}

type Args = Record<string, unknown>;

export interface Outcome {
  /** What the model is told. */
  result: string;
  isError?: boolean;
  touched: Omit<Touched, 'id' | 'state'> & { state?: Touched['state'] };
}

const nodeText = (map: DerivedMap, id: string) => {
  const n = map.byId[id];
  const stage = n.stage ? map.stages.find((s) => s.id === n.stage) : undefined;
  const links = map.edges
    .filter((e) => e.from === id || e.to === id)
    .map((e) => `${map.byId[e.from]?.label} -${e.label || e.kind}-> ${map.byId[e.to]?.label}`);
  return [
    `${n.label} [${n.id}] — ${n.kind}, ${n.status}, region ${n.domain}`,
    n.summary,
    stage ? `On the route in stage ${stage.order} "${stage.title}".` : 'Not on the route.',
    links.length ? `Links: ${links.join('; ')}` : '',
    n.docs?.length ? `Docs: ${n.docs.map((d) => `${d.title} (${d.url})`).join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

/**
 * Runs one call against the map. A bad id comes back as an error the model
 * can recover from, never as a thrown exception that ends the answer.
 */
export function run(app: AppState, name: string, args: Args): Outcome {
  const map = app.map;
  const str = (k: string) => (typeof args[k] === 'string' ? (args[k] as string) : '');
  const unknownNode = (id: string, tool: ToolName, verb: [string, string]): Outcome => ({
    result: `No concept with id "${id}". Use the ids from the map outline, or search_map.`,
    isError: true,
    touched: { tool, verb, subject: id || 'unknown concept', state: 'failed', quiet: true },
  });

  switch (name as ToolName) {
    case 'get_node': {
      const id = str('id');
      if (!map.byId[id]) return unknownNode(id, 'get_node', ['Read', 'Read']);
      return {
        result: nodeText(map, id),
        touched: {
          tool: 'get_node',
          verb: ['Read', 'Read'],
          subject: map.byId[id].label,
          target: { node: id },
          quiet: true,
        },
      };
    }
    case 'get_stage': {
      const order = Number(args.order);
      const s = map.stages.find((x) => x.order === order);
      if (!s)
        return {
          result: `No stage ${order}; stages are 1 to ${map.stages.length}.`,
          isError: true,
          touched: {
            tool: 'get_stage',
            verb: ['Read', 'Read'],
            subject: `stage ${order}`,
            state: 'failed',
            quiet: true,
          },
        };
      const lines = (phase: 'do' | 'observe') =>
        app.steps(s, phase).map((st, i) => `${i + 1}. ${st.text}${st.tip ? ` (tip: ${st.tip})` : ''}`);
      return {
        result: [
          `Stage ${s.order} [${s.id}] "${s.title}" — ${s.task}`,
          `Do:\n${lines('do').join('\n')}`,
          s.observe.length ? `Observe:\n${lines('observe').join('\n')}` : '',
          `Read: ${s.read.map((id) => map.byId[id]?.label ?? id).join(', ')}`,
          `Checkpoint: ${s.checkpoint}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        touched: {
          tool: 'get_stage',
          verb: ['Read', 'Read'],
          subject: s.title,
          target: { stage: s.order },
          quiet: true,
        },
      };
    }
    case 'search_map': {
      const words = str('query').toLowerCase().split(/\W+/).filter(Boolean);
      const scored = map.nodes
        .filter((n) => n.kind !== 'category')
        .map((n) => {
          const hay = `${n.label} ${n.summary} ${(n.tags ?? []).join(' ')}`.toLowerCase();
          const label = n.label.toLowerCase();
          return {
            n,
            score: words.reduce((sum, w) => sum + (label.includes(w) ? 3 : hay.includes(w) ? 1 : 0), 0),
          };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      return {
        result: scored.length
          ? scored.map(({ n }) => `${n.id} | ${n.label}: ${n.summary}`).join('\n')
          : 'Nothing on the map matches.',
        touched: {
          tool: 'search_map',
          verb: ['Search', 'Searched'],
          subject: `“${str('query')}”`,
          quiet: true,
        },
      };
    }
    case 'open_node': {
      const id = str('id');
      if (!map.byId[id]) return unknownNode(id, 'open_node', ['Open', 'Opened']);
      app.select(id);
      return {
        result: `Opened ${map.byId[id].label} in the panel.`,
        touched: {
          tool: 'open_node',
          verb: ['Open', 'Opened'],
          subject: map.byId[id].label,
          target: { node: id },
        },
      };
    }
    case 'go_to_stage': {
      const order = Number(args.order);
      const s = map.stages.find((x) => x.order === order);
      if (!s)
        return {
          result: `No stage ${order}.`,
          isError: true,
          touched: {
            tool: 'go_to_stage',
            verb: ['Go to', 'Went to'],
            subject: `stage ${order}`,
            state: 'failed',
          },
        };
      app.goto(order);
      const phase = str('phase');
      if (phase === 'brief' || phase === 'do' || phase === 'observe' || phase === 'read') app.setPhase(phase);
      return {
        result: `The learner is now at stage ${order} "${s.title}"${phase ? `, ${phase}` : ''}.`,
        touched: {
          tool: 'go_to_stage',
          verb: ['Go to', 'Went to'],
          subject: s.title,
          target: { stage: order },
        },
      };
    }
    case 'point_at': {
      const ids = Array.isArray(args.ids)
        ? (args.ids as unknown[]).filter((x): x is string => typeof x === 'string')
        : [];
      const known = ids.filter((id) => map.byId[id]);
      const missing = ids.filter((id) => !map.byId[id]);
      if (!known.length) return unknownNode(ids.join(', '), 'point_at', ['Point at', 'Pointed at']);
      app.pointAt(known, str('caption'));
      const names = known.map((id) => map.byId[id].label);
      return {
        result: `Lit up ${names.join(', ')} on the map.${missing.length ? ` Unknown ids ignored: ${missing.join(', ')}.` : ''}`,
        touched: {
          tool: 'point_at',
          verb: ['Point at', 'Pointed at'],
          subject:
            names.length > 2
              ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
              : names.join(' and '),
        },
      };
    }
    case 'propose_progress': {
      const action = str('action');
      if (action === 'mark_read') {
        const id = str('id');
        if (!map.byId[id]) return unknownNode(id, 'propose_progress', ['Mark read', 'Marked read']);
        return {
          result: 'Asked the learner; they decide. Do not assume it is done.',
          touched: {
            tool: 'propose_progress',
            verb: ['Mark read', 'Marked read'],
            subject: map.byId[id].label,
            target: { node: id },
            state: 'proposed',
            proposal: { action: 'mark_read', id },
          },
        };
      }
      return {
        result: 'Asked the learner whether to move on; they decide.',
        touched: {
          tool: 'propose_progress',
          verb: ['Move on to the next step', 'Moved on'],
          subject: app.currentStage.title,
          state: 'proposed',
          proposal: { action: 'next_step' },
        },
      };
    }
    default:
      return {
        result: `There is no tool called ${name}.`,
        isError: true,
        touched: { tool: 'get_node', verb: ['Use', 'Used'], subject: name, state: 'failed', quiet: true },
      };
  }
}
