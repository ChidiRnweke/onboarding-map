---
title: Verifying a change
description: How to prove a change works — CLI output, a packed tarball, or before/after screenshots.
---

## Core or CLI

Exercise the command on a template and paste the output in the PR's **Evidence** section:

```sh
node dist/cli/index.js validate --map templates/physics.ts --json
```

For `init` or `build` changes, produce the artifact users actually get: `npm pack` and install the
tarball in a scratch folder, then run the command there.

## The app

Build a map with your branch and with `main`, serve both, and compare:

```sh
node tools/shoot.mjs <new-url> <out> --baseline <main-url>
node tools/diff.mjs <out>
```

This needs `npx playwright install chromium` once. The `--states` selectors are stale; drive
interactions yourself when they matter.

For a single state — a quick check, or one evidence image — use `capture.mjs` instead of a one-off
script:

```sh
node tools/capture.mjs http://localhost:5173/ out.png --hash '#provision/do/3' --theme dark
```

Put before/after captures in the PR with captions naming the map, state and result. Commit only
useful evidence under `docs/pr-evidence/<task>/`, and embed it in the PR with a commit-pinned raw
URL.

## The docs site

The docs build includes a live map, so it depends on the package. Verify both:

```sh
npm run docs:embed                  # build the physics template into docs/public/embed
npm --prefix docs run build         # type-check and build the docs
```

See [the docs site](/contributor-guide/docs-site/) for how the theme and the embed fit together.

## Agents depend on the model

A change to the model or to what the CLI prints can break map authors' agents. Update the matching
`skills/*/SKILL.md` and the user-guide pages in the same PR.
