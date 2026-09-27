---
title: Development
description: Set up the repository, run the app and the checks, and work in a linked worktree.
---

Node 22.18 or later is required. `node` is not always on `PATH`; if you use nvm, prepend its bin
directory before any `npm` or `npx` command.

```sh
npm install
npm run dev      # the app; ONBOARDING_MAP=<file> picks the map (default templates/physics.ts)
npm run build
npm run check    # svelte-check + tsc for src/core and src/cli
npm run lint     # prettier + eslint
```

Validate a template:

```sh
node dist/cli/index.js validate --map templates/starter.ts   # and templates/physics.ts
```

## Work in a linked worktree

`main` is protected; changes arrive only through squash-merged PRs. Work in a linked worktree on a
task branch, never in the main checkout or on `main`.

```sh
git worktree add artifacts/worktrees/<task-slug> -b <type>/<task-slug> origin/main
cd artifacts/worktrees/<task-slug> && npm install
```

Worktrees live under `artifacts/worktrees/`, which is ignored (also by Prettier and ESLint).

## Style notes

`src/core/model.ts` and `templates/physics.ts` are aligned by hand and ignored by Prettier; keep
their column style when editing them.

Imports in `src/core` and `src/cli` name their `.ts` file (`'./model.ts'`); `tsc` rewrites them and
Node needs the extension at runtime.

Map files are loaded by Node itself (type stripping), so a template may only use erasable TypeScript
and must import from `'onboarding-map'`.
