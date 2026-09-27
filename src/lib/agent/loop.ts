import type { Message } from '@earendil-works/pi-ai';
import type { AppState } from '$lib/state.svelte';
import type { Anchor } from './actions';
import type { AgentState, Turn } from './agent.svelte';
import { explain, type AgentClient } from './client';
import { systemPrompt } from './context';
import { COVERAGE, run, TOOLS, type ToolName } from './tools';

/**
 * One answer: stream the model, run the tools it calls against the map, feed
 * the results back, and repeat until it answers without calling anything.
 *
 * Capped at a few rounds, so a model that keeps looking things up stops
 * costing the learner money. A stop from the learner ends the stream where it
 * is; what arrived stays.
 */
const MAX_ROUNDS = 6;

/**
 * Tools that take the learner somewhere, so the turn offers the way back.
 * Pointing only lights things up where the learner already is; its caption on
 * the map is how it is dismissed.
 */
const MOVES = new Set<ToolName>(
  Object.values(COVERAGE).flatMap((c) => (c.class === 'navigate' && c.tool !== 'point_at' ? [c.tool] : [])),
);

export interface Answer {
  agent: AgentState;
  app: AppState;
  client: AgentClient;
  anchor: Anchor;
  key: string;
  transcript: Message[];
  turn: Turn;
  signal: AbortSignal;
  instructions?: string;
}

export async function answer({
  agent,
  app,
  client,
  anchor,
  key,
  transcript,
  turn,
  signal,
  instructions,
}: Answer) {
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const position = {
      stage: app.currentStage,
      phase: app.phase,
      step: app.step,
      selected: app.selected,
      read: app.stageProgress.read,
    };
    const stream = client.stream(
      {
        systemPrompt: systemPrompt(app.map, position, anchor, instructions),
        messages: transcript,
        tools: TOOLS,
      },
      signal,
    );
    // Text from an earlier round and this one read as separate paragraphs.
    const lead = turn.text && !turn.text.endsWith('\n') ? '\n\n' : '';
    let started = false;
    for await (const event of stream) {
      if (event.type === 'text_delta') {
        if (!started) turn.text += lead;
        started = true;
        turn.text += event.delta;
      }
    }
    const message = await stream.result();
    transcript.push(message);

    if (message.stopReason === 'aborted') return;
    if (message.stopReason === 'error') {
      turn.error = explain(message.errorMessage ?? 'The model returned an error.', agent.connection!);
      return;
    }

    const calls = message.content.filter((b) => b.type === 'toolCall');
    if (!calls.length) return;

    for (const call of calls) {
      const moves = MOVES.has(call.name as ToolName);
      // The place before the first move is the one to go back to.
      if (moves && !turn.before) turn.before = app.snapshot();
      // Asked from the assistant's own view, the answer stays in view while the map moves.
      const inView = app.agentOpen;
      const outcome = run(app, call.name, call.arguments);
      if (inView) app.agentOpen = true;
      if (moves && !outcome.isError) agent.moved(key);

      turn.touched.push({ id: call.id, state: 'done', ...outcome.touched });
      transcript.push({
        role: 'toolResult',
        toolCallId: call.id,
        toolName: call.name,
        content: [{ type: 'text', text: outcome.result }],
        isError: Boolean(outcome.isError),
        timestamp: Date.now(),
      });
    }
  }
  turn.error = 'The model kept looking things up without answering. Try asking more narrowly.';
}
