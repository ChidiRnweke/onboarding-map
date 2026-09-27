import type { Labels } from './model.ts';

/** Every field optional, at any depth: what a map has to say about its copy. */
export type LabelsInput = { [K in keyof Labels]?: Labels[K] extends object ? Partial<Labels[K]> : Labels[K] };

/**
 * Interface copy a map gets unless it says otherwise. Written for any subject;
 * a map overrides what fits its audience (`period: 'Week'`, `tip.label: 'Ask Copilot'`).
 */
export const DEFAULT_LABELS: Labels = {
  pageTitle: '',
  intro: 'Follow the route; the rest of the map is territory to recognise, not learn.',
  start: 'you start here',
  period: 'Day',
  view: { label: 'Map detail', focus: 'Focused', full: 'Everything' },
  stagePosition: '{period} {periodNumber}, stage {stage} of {total}',
  legend: {
    path: 'On your route',
    alternative: "An alternative we didn't pick",
    context: 'Good to know it exists',
    route: 'Your journey so far',
    showAll: 'Reveal later stages',
    heading: 'Legend',
    hide: 'Hide legend',
    show: 'Show legend',
  },
  method: {
    do: { lead: 'first', title: 'Do' },
    observe: { lead: 'then', title: 'Observe' },
    read: { lead: 'and only then', title: 'Read' },
  },
  tip: { label: 'Try this', copy: 'Copy', copied: 'Copied', hint: 'Hint', reveal: 'Show {label}' },
  checkpoint: "You're done when",
  pager: { previous: 'Previous stage', next: 'Next stage', complete: 'Journey complete' },
  node: {
    proposed: 'Proposed',
    back: '← Back to stage {stage}',
    onRoute: 'On your route in {stage}',
    onRouteStage: 'stage {stageNumber}, {stageTitle}',
    alternativeTo: 'An alternative to {node}',
    context: 'Good to know it exists',
    connections: 'How it connects',
    incomingSuffix: 'it',
    alternatives: 'Could have been',
    pendingLink: 'Link not added yet',
    moreDocs: 'More documentation',
    backToRead: '← Reading for stage {n}, {stage}',
    readProgress: '{n} of {total}',
    nextRead: 'Next: {node}',
    group: 'Group',
    inGroup: 'In this group',
  },
  refs: { heading: 'From our sources', noLink: 'Internal document', slide: 'slide', slides: 'slides' },
  goal: {
    heading: 'The goal',
    doneWhen: 'The goal is reached when',
    produces: "Once it's built, you have",
    builtFrom: 'Made of',
    partOf: 'Part of {module}',
    partNumber: 'Part {n} of {total} of {goal}',
    itsVerb: '{verb} it',
    optional: 'Optional',
    back: '← Back to stage {stage}',
    progress: '{done} of {total} parts built',
  },
  bigPicture: {
    open: 'See the big picture',
    heading: 'The big picture',
    part: 'Part {n} of {total}',
    builtIn: 'Built in {stage}',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    start: 'Start with {stage}',
    buildsOn: 'builds on',
    bridgeFirst: 'Nothing is built yet. This stage lays the first part: {module}.',
    bridge: 'So far you have {done}. This stage adds {module}.',
    bridgeNone: 'Every part is in place. This stage is about seeing the whole.',
    lookBack: 'Step back',
    nowBuilt: '{module} is in place.',
    nextUp: 'Next up',
    yourNotes: 'What you noted',
    youAreHere: 'You are here',
  },
  periodOverview: {
    open: 'What {period} {n} gives you',
    position: '{period} {n} of {total}',
    gives: 'gives you',
    endOf: 'By the end of {period} {n}',
    start: 'Start {period} {n}',
  },
  phases: {
    brief: 'Start',
    do: 'Do',
    observe: 'Observe',
    read: 'Read',
    done: 'Done when',
    next: 'Next',
    previous: 'Back',
    continueTo: 'On to {phase}',
    notePlaceholder: 'What did you notice?',
    markRead: 'Mark as read',
    complete: 'Complete stage',
  },
  aria: {
    stages: 'Onboarding stages',
    map: 'Map',
    mapImage: 'Radial map of the territory with your route highlighted',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit map to screen',
    togglePanel: 'Show or hide the stage details',
  },
  region: {
    context: 'Region of the map',
    onRoute: '{n} on your route',
    route: 'On your route here',
    parts: 'Goal parts built here',
    contents: 'What is in it',
    more: '+ {n} more',
  },
  kind: {
    context: 'Kind of thing',
    count: '{n} on your route · {total} in all',
    onRoute: 'On your route',
    elsewhere: 'Elsewhere on the map',
  },
  sources: { vendor: 'Official docs', community: 'Community', internal: 'Internal' },
  agent: {
    walkThrough: 'Walk me through it',
    explainNode: 'Explain for this stage',
    explainLink: 'Explain connection',
    takeaways: 'What to take away',
    checkMe: 'Check my understanding',
    fit: 'How does this fit?',
    summarize: 'Summarise this region',
    checkNote: 'Check what I noticed',
    ask: 'Ask about the map',
    context: 'Before it answers, the agent reads this map and knows you are at {place}.',
    followUp: 'Ask a follow-up',
    provenance: 'Explained by {model}, not from the map',
    earlier: 'Asked earlier',
    back: 'Back to where you were',
    stop: 'Stop',
    retry: 'Try again',
    accept: 'Yes',
    decline: 'Not now',
    setup: 'Set up your agent',
    setupIntro:
      'Pick where your model runs. Your key stays in this browser and is sent only to that provider.',
    test: 'Test and continue',
    settings: 'Agent settings',
    forget: 'Forget this key',
  },
};

/** The map's own copy over the defaults, one level deep (every group is flat). */
export function withDefaults(input: LabelsInput = {}): Labels {
  const out = { ...DEFAULT_LABELS } as Record<string, unknown>;
  for (const [key, value] of Object.entries(input)) {
    const base = (DEFAULT_LABELS as unknown as Record<string, unknown>)[key];
    out[key] =
      value && typeof value === 'object' && base && typeof base === 'object'
        ? { ...(base as object), ...(value as object) }
        : value;
  }
  return out as unknown as Labels;
}
