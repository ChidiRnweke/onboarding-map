import { defineMap, docLink } from 'onboarding-map';

/*
 * A starting point: two regions, a handful of items and two stages. Replace it
 * with your own subject, or ask your coding agent to (see AGENTS.md).
 *
 * The map has two layers:
 *  - the TERRITORY: regions (domains) → groups (categories) → items.
 *    Every item is on the route ('path'), a choice not taken ('alternative'),
 *    or worth knowing it exists ('context').
 *  - the JOURNEY: stages, each Do → Observe → Read, that pass through the
 *    route's items and together build the goal.
 */

const docs = docLink('vendor');

export default defineMap({
  id: 'starter',
  version: '0.1.0',
  title: 'Your first week',
  motto: 'Do, observe, read, repeat.',
  labels: {
    intro:
      'Everything you will meet in your first week. Follow the route; the rest is territory to recognise.',
    period: 'Day',
  },

  kinds: [
    { id: 'tool', label: 'Tool', plural: 'Tools', description: 'Something you install and use.' },
    { id: 'concept', label: 'Concept', plural: 'Concepts', description: 'An idea you need to understand.' },
  ],
  periods: [{ period: 1, title: 'Getting set up', summary: 'From an empty laptop to your first change.' }],

  goal: {
    title: 'Your first change',
    statement: 'A small change of yours, reviewed and merged.',
    doneWhen: 'Your change is merged and you can explain every step it went through.',
    modules: [
      {
        id: 'workstation',
        title: 'Workstation',
        purpose: 'Everything else happens on it.',
        dependsOn: [],
        builtFrom: ['editor', 'git'],
        produces: ['An editor and git, set up and working'],
      },
      {
        id: 'change',
        title: 'Merged change',
        purpose: 'Proof that the whole loop works for you.',
        dependsOn: ['workstation'],
        relations: [{ to: 'workstation', verb: 'is made on' }],
        builtFrom: ['pull-request'],
        produces: ['A merged pull request'],
      },
    ],
  },

  domains: [
    { id: 'tools', label: 'Tools', tagline: 'What you work with', order: 0, color: '#3b82f6' },
    { id: 'process', label: 'Process', tagline: 'How work gets in', order: 1, color: '#10b981' },
  ],

  nodes: [
    {
      id: 'editors',
      label: 'Editor',
      domain: 'tools',
      kind: 'category',
      status: 'path',
      summary: 'Where you write code.',
    },
    {
      id: 'editor',
      label: 'VS Code',
      domain: 'tools',
      kind: 'tool',
      status: 'path',
      parent: 'editors',
      stage: 'setup',
      summary: 'The editor the team uses, with the extensions in the repository recommendations.',
      docs: [docs('VS Code docs', 'https://code.visualstudio.com/docs')],
    },
    {
      id: 'other-editor',
      label: 'JetBrains IDEs',
      domain: 'tools',
      kind: 'tool',
      status: 'alternative',
      alternativeTo: 'editor',
      parent: 'editors',
      summary: 'Works too; the team settings are only maintained for VS Code.',
    },
    {
      id: 'vcs',
      label: 'Version control',
      domain: 'tools',
      kind: 'category',
      status: 'path',
      summary: 'Keeping history.',
    },
    {
      id: 'git',
      label: 'Git',
      domain: 'tools',
      kind: 'tool',
      status: 'path',
      parent: 'vcs',
      stage: 'setup',
      summary: 'Records every change, so work can be shared, reviewed and undone.',
      docs: [docs('Pro Git', 'https://git-scm.com/book')],
    },
    {
      id: 'review',
      label: 'Review',
      domain: 'process',
      kind: 'category',
      status: 'path',
      summary: 'Getting work in.',
    },
    {
      id: 'pull-request',
      label: 'Pull request',
      domain: 'process',
      kind: 'concept',
      status: 'path',
      parent: 'review',
      stage: 'first-change',
      summary: 'A proposed change that others read and approve before it is merged.',
      docs: [docs('About pull requests', 'https://docs.github.com/en/pull-requests')],
    },
    {
      id: 'ci',
      label: 'CI checks',
      domain: 'process',
      kind: 'concept',
      status: 'context',
      parent: 'review',
      summary: 'Tests that run on every pull request. You will see them; you do not need to change them yet.',
    },
  ],

  edges: [{ from: 'pull-request', to: 'git', kind: 'builds-on' }],

  stages: [
    {
      id: 'setup',
      period: 1,
      order: 1,
      title: 'Set up',
      feeling: 'My laptop is ready and I know where the code lives.',
      task: 'Install the editor and git, and clone the repository.',
      delivers: ['workstation'],
      waypoints: ['editor', 'git'],
      do: [
        'Install VS Code and the recommended extensions.',
        { text: 'Clone the repository.', tip: 'git clone <url>' },
      ],
      observe: [{ text: 'What does `git log` show you?', note: true }],
      read: ['editor', 'git'],
      checkpoint: 'The project opens in your editor and `git status` is clean.',
    },
    {
      id: 'first-change',
      period: 1,
      order: 2,
      title: 'First change',
      feeling: 'I got a change reviewed and merged.',
      task: 'Make a small change and take it through review.',
      delivers: ['change'],
      waypoints: ['pull-request'],
      do: ['Fix a typo in the README on a new branch.', 'Open a pull request.'],
      observe: [{ text: 'Which checks ran on your pull request?', nodes: ['pull-request'], note: true }],
      read: ['pull-request', 'ci'],
      checkpoint: 'Your pull request is merged.',
    },
  ],
});
