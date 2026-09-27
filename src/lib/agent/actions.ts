import type { Labels } from '$core/model';

/**
 * Where the assistant can be asked something, and what each place asks.
 *
 * The assistant has no chat window to be found in. It is offered on the thing
 * it would act on: the step in hand, the concept open in the panel, the link
 * between two concepts, the checkpoint. So an action names its subject, and its
 * answer appears right there, under it. The one free-form entry (`map`) opens
 * the assistant's own view; it is the way in for questions no place owns.
 *
 * Labels are interface copy (labels.agent) so a map can rename them; the
 * request is what the model is asked, written for the model.
 */
export type Anchor =
  | { kind: 'step'; stage: string; phase: 'do' | 'observe'; index: number }
  | { kind: 'node'; id: string }
  | { kind: 'edge'; from: string; to: string }
  | { kind: 'read'; stage: string }
  | { kind: 'checkpoint'; stage: string }
  | { kind: 'module'; id: string }
  | { kind: 'region'; id: string }
  | { kind: 'map' };

/** Threads are kept per place, so coming back to a step finds what was asked there. */
export function anchorKey(a: Anchor): string {
  switch (a.kind) {
    case 'step':
      return `step:${a.stage}:${a.phase}:${a.index}`;
    case 'edge':
      return `edge:${a.from}>${a.to}`;
    case 'node':
    case 'module':
    case 'region':
      return `${a.kind}:${a.id}`;
    case 'read':
    case 'checkpoint':
      return `${a.kind}:${a.stage}`;
    case 'map':
      return 'map';
  }
}

export interface AgentAction {
  /** The button's words, from labels.agent. */
  label: (labels: Labels['agent']) => string;
  /** What the model is asked when the learner presses it. */
  request: string;
}

export const ACTIONS: Record<Exclude<Anchor['kind'], 'map'>, AgentAction> = {
  step: {
    label: (l) => l.walkThrough,
    request:
      'Walk me through this step. Say what to do and what I should see when it worked, for my situation. ' +
      'Point at the concepts on the map the step touches.',
  },
  node: {
    label: (l) => l.explainNode,
    request:
      'Explain this concept for the stage I am in: what it is for in the task in hand, not in general. ' +
      'If it connects to something I have already met, say how.',
  },
  edge: {
    label: (l) => l.explainLink,
    request:
      'Explain this link: why the one relates to the other in this way, and what that means in practice for me.',
  },
  read: {
    label: (l) => l.takeaways,
    request:
      'From this stage’s reading, what are the two or three things I must take away for the task? ' +
      'Point at the concepts they are about.',
  },
  checkpoint: {
    label: (l) => l.checkMe,
    request:
      'Check my understanding of this stage against its checkpoint. Ask me one short question at a time, ' +
      'wait for my answer, then say plainly whether it holds and why, and ask the next. Three questions at most. ' +
      'If I got something wrong, point at the concept on the map to revisit.',
  },
  region: {
    label: (l) => l.summarize,
    request:
      'Summarise this region of the map: what it covers, what on my route passes through it and at which stage, ' +
      'and what I can safely leave for later. Point at the few concepts that matter most.',
  },
  module: {
    label: (l) => l.fit,
    request:
      'How does this part of the goal fit the whole: what it is built from, which stages build it, ' +
      'and what would be missing without it? Point at what it is built from.',
  },
};
