---
title: Pull requests
description: Conventional commits, the PR template, and the checks a change must pass.
---

One PR per coherent task. Commit conventionally, push the branch, and open the PR with a title that
follows the same convention.

## Conventional Commits

Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/): a type
from the Angular set, an optional scope, then a lowercase subject.

```
feat(cli): serve the map from a subpath
fix: keep the intro open on a first visit
docs: explain the audit kinds
```

The type decides the release: `fix` → patch, `feat` → minor, a breaking change → major (minor while
below 1.0). Use `!` or a `BREAKING CHANGE:` footer for breaking changes.

Do not add `Co-Authored-By` or other attribution trailers.

Enforcement is server-side: `commitlint` checks the PR's commits and `pr-title` checks the PR title,
which becomes the commit on `main` under squash merge. There are no local hooks, so check before
pushing:

```sh
npx commitlint --from origin/main
```

## The PR body

Follow `.github/pull_request_template.md`, in short plain sentences:

- **Why** — the original problem and the intended outcome.
- **What changed** — behavior before and after, not a file inventory.
- **Evidence** — a repeatable scenario and the observed result.
- **Validation** — the checks you actually ran.

## Definition of done

A PR is done when `check` (build, type check, lint, templates validate), `commitlint` and `pr-title`
pass. Run these locally first:

```sh
npm run build && npm run check && npm run lint
```
