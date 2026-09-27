import { getContext, setContext } from 'svelte';
import type { Message } from '@earendil-works/pi-ai';
import type { DerivedMap } from '$core/model';
import { mapKey, load, save } from '$lib/progress';
import type { AppState, Place } from '$lib/state.svelte';
import { anchorKey, ACTIONS, type Anchor } from './actions';
import type { AgentClient } from './client';
import {
  isComplete,
  loadKey,
  loadSettings,
  preset,
  saveConnection,
  forget,
  type Connection,
} from './settings';
import type { Touched } from './tools';

/**
 * The assistant's state: one thread per place it was asked something, and the
 * connection to the learner's model.
 *
 * A thread belongs to its anchor (a step, a concept, a link, a checkpoint), so
 * it is shown there and found there again. Threads and their transcripts are
 * kept in this browser with the learner's progress. Nothing about pi-ai is
 * loaded until the first question: the client, the tools and the loop are
 * imported on demand.
 */
export interface Turn {
  role: 'user' | 'assistant';
  text: string;
  /** What the turn did on the map, in order. */
  touched: Touched[];
  error?: string;
  /** Which model wrote it. */
  model?: string;
  /** Where the learner was before this turn moved them. */
  before?: Place;
}

export interface Thread {
  key: string;
  anchor: Anchor;
  /** What the anchor was called when asked, for lists away from it. */
  title: string;
  turns: Turn[];
  status: 'idle' | 'running' | 'setup';
  updated: number;
}

const MAX_THREADS = 40;

/** Development only: `?agent=faux` answers with a scripted model, no key needed. */
const faux = () => import.meta.env.DEV && /[?&]agent=faux(&|$)/.test(location.search);

export class AgentState {
  readonly app: AppState;
  readonly map: DerivedMap;
  /** The map's author turned the assistant on. */
  readonly enabled: boolean;
  /** An organisation proxy holds the key; the learner is never asked for one. */
  readonly keyless: boolean;

  threads = $state<Record<string, Thread>>({});
  /**
   * A thread whose answer moved the learner away from where they asked. It
   * travels with them, shown at the top of the panel, so the answer that
   * explains the move is not left behind on a screen they can no longer see.
   */
  carried = $state<string | null>(null);
  connection = $state<Connection | null>(null);

  /** The model's own transcript per thread, kept out of Svelte's proxies: pi-ai clones it. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- deliberately not reactive
  #transcripts = new Map<string, Message[]>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- abort handles, not state
  #controllers = new Map<string, AbortController>();
  #client: Promise<AgentClient> | null = null;
  /** Threads asked in during this visit: they open; ones from earlier visits start folded. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- read once, when a thread mounts
  #fresh = new Set<string>();

  constructor(app: AppState) {
    this.app = app;
    this.map = app.map;
    const p = preset(app.map);
    this.enabled = p !== null;
    this.keyless = Boolean(p?.keyless);
  }

  /** Everything the chosen provider needs is filled in. */
  readonly ready = $derived.by(
    () => faux() || (this.connection !== null && isComplete(this.connection, this.keyless)),
  );

  /** Recent threads, newest first, for the assistant's own view. */
  readonly recent = $derived.by(() =>
    Object.values(this.threads)
      .filter((t) => t.turns.length)
      .sort((a, b) => b.updated - a.updated),
  );

  /** Loads what this browser remembers. Called once the page runs in a browser. */
  restore(): void {
    if (!this.enabled) return;
    const p = preset(this.map)!;
    const saved = loadSettings(this.map);
    if (saved) this.connection = { ...saved, key: loadKey(this.map, saved.provider) };
    else if (p.provider && (this.keyless || p.provider === 'ollama' || p.provider === 'lmstudio'))
      // Nothing to ask the learner for: the author named everything.
      this.connection = {
        provider: p.provider,
        model: p.model ?? '',
        baseURL: p.baseURL,
        remember: true,
        key: '',
      };

    const stored = load<{ threads: Thread[]; transcripts: Record<string, Message[]> }>(
      mapKey(this.map),
      'agent-threads',
      { threads: [], transcripts: {} },
    );
    for (const t of stored.threads) {
      // A run cannot outlive the page; one cut short reads as stopped.
      this.threads[t.key] = { ...t, status: 'idle' };
      this.#transcripts.set(t.key, stored.transcripts[t.key] ?? []);
    }
  }

  /** The thread to show at the top of the panel, if its own place is out of view. */
  readonly carriedThread = $derived.by(() => {
    const t = this.carried ? this.threads[this.carried] : undefined;
    return t && !this.shown(t.anchor) ? t : undefined;
  });

  /** Whether the panel is showing the place a thread belongs to. */
  shown(a: Anchor): boolean {
    const app = this.app;
    const stage = app.panelView === 'stage' ? app.currentStage.id : null;
    switch (a.kind) {
      case 'step':
        return stage === a.stage && app.phase === a.phase && app.step === a.index;
      case 'read':
        return stage === a.stage && app.phase === 'read';
      case 'checkpoint':
        return stage === a.stage && app.phase === 'done';
      case 'node':
        return app.panelView === 'node' && app.selected === a.id;
      case 'edge':
        return app.panelView === 'node' && (app.selected === a.from || app.selected === a.to);
      case 'module':
        return app.panelView === 'module' && app.module === a.id;
      case 'region':
        return app.panelView === 'region' && app.region === a.id;
      case 'map':
        return app.agentOpen;
    }
  }

  /** Called by the loop when an answer takes the learner somewhere. */
  moved(key: string): void {
    this.carried = key;
  }

  /** Asked during this visit, so shown open rather than folded. */
  fresh(key: string): boolean {
    return this.#fresh.has(key);
  }

  thread(anchor: Anchor): Thread | undefined {
    return this.threads[anchorKey(anchor)];
  }

  /**
   * Asks at a place: the action's own request, or the learner's words (shown
   * as `label` when they are a prompt built for the learner, like a note to
   * check). Without
   * a model yet, the thread turns into the setup, right there, and the question
   * runs as soon as setup succeeds.
   */
  ask(anchor: Anchor, title: string, text?: string, label?: string): void {
    const key = anchorKey(anchor);
    if (this.threads[key]?.status === 'running') return;
    if (this.carried !== key) this.carried = null;
    this.#fresh.add(key);
    const request = text ?? (anchor.kind === 'map' ? '' : ACTIONS[anchor.kind].request);
    if (!request.trim()) return;
    // What the thread shows for the question: the learner's words, or the action's name.
    const shown =
      label ?? text ?? (anchor.kind === 'map' ? request : ACTIONS[anchor.kind].label(this.map.labels.agent));

    const thread = (this.threads[key] ??= {
      key,
      anchor,
      title,
      turns: [],
      status: 'idle',
      updated: Date.now(),
    });
    thread.turns.push({ role: 'user', text: shown, touched: [] });
    const transcript = this.#transcripts.get(key) ?? [];
    transcript.push({ role: 'user', content: request, timestamp: Date.now() });
    this.#transcripts.set(key, transcript);
    thread.updated = Date.now();

    if (!this.ready) {
      thread.status = 'setup';
      return;
    }
    void this.#run(key);
  }

  /** The learner finished the setup: keep it, and answer whatever was waiting on it. */
  configure(connection: Connection): void {
    this.connection = connection;
    this.#client = null;
    saveConnection(this.map, connection);
    for (const t of Object.values(this.threads)) if (t.status === 'setup') void this.#run(t.key);
  }

  /** Opens the setup again from a thread, e.g. after a key was refused. */
  reconfigure(key: string): void {
    const t = this.threads[key];
    if (t && t.status !== 'running') t.status = 'setup';
  }

  forgetKey(): void {
    if (!this.connection) return;
    forget(this.map, this.connection.provider);
    this.connection = null;
    this.#client = null;
  }

  stop(key: string): void {
    this.#controllers.get(key)?.abort();
  }

  /** Asks the last question again, after a failure or a stop. */
  retry(key: string): void {
    const t = this.threads[key];
    if (!t || t.status === 'running') return;
    const last = t.turns.at(-1);
    if (last?.role === 'assistant') t.turns.pop();
    // Drop the failed answer from the transcript too, back to the question.
    const transcript = this.#transcripts.get(key) ?? [];
    while (transcript.length && transcript.at(-1)!.role !== 'user') transcript.pop();
    void this.#run(key);
  }

  /** Puts the learner back where they were before the turn moved them. */
  back(turn: Turn): void {
    if (turn.before) this.app.returnTo(turn.before);
    turn.before = undefined;
    this.carried = null;
    this.#persist();
  }

  /** The learner answers a proposal. */
  decide(item: Touched, accept: boolean): void {
    if (item.state !== 'proposed' || !item.proposal) return;
    item.state = accept ? 'accepted' : 'declined';
    if (accept && item.proposal.action === 'mark_read' && item.proposal.id)
      this.app.markRead(item.proposal.id);
    if (accept && item.proposal.action === 'next_step') this.app.forward();
    this.#persist();
  }

  /** Clears a thread, e.g. to start a place over. */
  clear(key: string): void {
    this.stop(key);
    if (this.carried === key) this.carried = null;
    delete this.threads[key];
    this.#transcripts.delete(key);
    this.#persist();
  }

  async #connect(): Promise<AgentClient> {
    if (faux()) return (await import('./faux')).fauxClient();
    const { connect } = await import('./client');
    return connect(this.connection!);
  }

  async #run(key: string): Promise<void> {
    const thread = this.threads[key];
    const controller = new AbortController();
    this.#controllers.set(key, controller);
    thread.status = 'running';
    thread.turns.push({ role: 'assistant', text: '', touched: [] });
    // The proxied turn, so the loop's writes reach the page.
    const turn = thread.turns.at(-1)!;
    try {
      this.#client ??= this.#connect();
      const client = await this.#client;
      turn.model = client.label;
      const { answer } = await import('./loop');
      await answer({
        agent: this,
        app: this.app,
        client,
        anchor: thread.anchor,
        key,
        transcript: this.#transcripts.get(key)!,
        turn,
        signal: controller.signal,
        instructions: preset(this.map)?.instructions,
      });
    } catch (error) {
      this.#client = null;
      const { explain } = await import('./client');
      turn.error = explain(error instanceof Error ? error.message : String(error), this.connection!);
    } finally {
      this.#controllers.delete(key);
      thread.status = 'idle';
      thread.updated = Date.now();
      this.#persist();
    }
  }

  #persist(): void {
    const threads = this.recent.slice(0, MAX_THREADS).map((t) => $state.snapshot(t) as Thread);
    const transcripts = Object.fromEntries(threads.map((t) => [t.key, this.#transcripts.get(t.key) ?? []]));
    save(mapKey(this.map), 'agent-threads', { threads, transcripts });
  }
}

const KEY = Symbol('onboarding-map-agent');

export function setAgent(app: AppState): AgentState {
  return setContext(KEY, new AgentState(app));
}

export function getAgent(): AgentState {
  return getContext<AgentState>(KEY);
}
