import {
  createModels,
  fauxAssistantMessage,
  fauxProvider,
  fauxText,
  fauxToolCall,
  type Context,
} from '@earendil-works/pi-ai';
import type { AgentClient } from './client';

/**
 * A scripted model for development (`?agent=faux`), so the assistant can be
 * worked on, and shown, without a key. It behaves like a model that uses the
 * map: asked something, it points at the concepts the question is about, then
 * answers. Only imported in dev builds.
 */
export function fauxClient(): AgentClient {
  const faux = fauxProvider({ tokensPerSecond: 90 });
  const models = createModels();
  models.setProvider(faux.provider);
  const model = faux.getModel();

  const ids = (prompt: string) => {
    const touches = /Concepts it touches: (.+)/.exec(prompt)?.[1];
    const link = /The link: (\S+) -.+?-> (\S+)/.exec(prompt);
    const waypoints = /\(waypoints: ([^)]+)\)/.exec(prompt)?.[1];
    // A region lists its items as "Name [id]"; point at the first few.
    const group = /^Group [^:]+: (.+)$/m.exec(prompt)?.[1];
    const inRegion = group ? [...group.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]).join(', ') : undefined;
    const list = touches ?? (link ? `${link[1]}, ${link[2]}` : (inRegion ?? waypoints)) ?? '';
    return list
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
  };

  return {
    model,
    label: 'Faux model (dev)',
    stream(context: Context, signal: AbortSignal) {
      const last = context.messages.at(-1);
      const nodes = ids(context.systemPrompt ?? '');
      const asked = context.messages.filter((m) => m.role === 'user').length;
      if (last?.role === 'user' && nodes.length && asked === 1)
        // First question: show what it is about.
        faux.setResponses([
          fauxAssistantMessage([fauxToolCall('point_at', { ids: nodes, caption: 'What this is about' })], {
            stopReason: 'toolUse',
          }),
        ]);
      else if (last?.role === 'user' && nodes.length)
        // A follow-up: open the concept to read next, and offer to tick it off.
        faux.setResponses([
          fauxAssistantMessage(
            [
              fauxToolCall('open_node', { id: nodes[0] }),
              fauxToolCall('propose_progress', { action: 'mark_read', id: nodes[0] }),
            ],
            { stopReason: 'toolUse' },
          ),
        ]);
      else
        faux.setResponses([
          fauxAssistantMessage([
            fauxText(
              asked === 1
                ? 'Start with the **first concept lit up on the map**: it is what the step leans on.\n\n' +
                    '1. Do the step as written, one command at a time.\n' +
                    '2. Check you see the result the step describes before moving on.\n\n' +
                    'If something looks different, tell me what you see and we will work out which part differs.'
                : 'That usually means one measurement is off. I opened the concept to check against; ' +
                    'read its first paragraph and compare it with what you wrote down.',
            ),
          ]),
        ]);
      return models.stream(model, context, { signal });
    },
  };
}
