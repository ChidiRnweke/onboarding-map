# onboarding-map

An npm package that renders an onboarding map for any subject: a radial map of a territory with one
route through it, walked in stages of do → observe → read. A user's project holds one map file
(`map.ts` or `map.json`); the package's CLI validates it and serves or builds it next to a prebuilt
SvelteKit shell. See `README.md` for the user-facing side.

`node` is not on `PATH` by default — prepend `~/.nvm/versions/node/v24.21.0/bin` before any `npm`
or `npx` command.

## Where things live

| Path                      | Holds                                                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/`               | The data model (`model.ts`: types, `validate`, `derive`), labels, `changelog`, `audit`, map loading. No Svelte; runs in Node and the browser. It is what map files import as `onboarding-map`.                      |
| `src/cli/`                | The `onboarding-map` command (citty): `init`, `dev`, `build`, `validate`, `changelog`, `audit`, `schema`, `skills install`.                                                                                         |
| `src/routes/`, `src/lib/` | The app: a static shell that fetches `map.json` at runtime and renders it.                                                                                                                                          |
| `templates/`              | Maps that `init --template` copies. `starter` is minimal; `physics` is a complete example outside software.                                                                                                         |
| `skills/`                 | **Product, not instructions for working here.** Skills shipped to map authors' coding agents by `init` and `skills install`, into `.claude/skills`, `.agents/skills` and/or `.codex/skills` (`src/cli/targets.ts`). |
| `tools/`                  | Visual regression: `shoot.mjs` screenshots two served builds, `diff.mjs` pixel-diffs them.                                                                                                                          |

`npm run build` compiles `src/core` + `src/cli` with `tsc` to `dist/core` and `dist/cli`, generates
`schema/map.schema.json` from `OnboardingMap`, and builds the shell to `dist/app`. The CLI copies
`dist/app` next to a map's `map.json`.

## Commands

```bash
npm run dev      # the app; ONBOARDING_MAP=<file> picks the map (default templates/physics.ts)
npm run build
npm run check    # svelte-check + tsc for src/core and src/cli
npm run lint     # prettier + eslint
node dist/cli/index.js validate --map templates/starter.ts   # and templates/physics.ts
```

`src/core/model.ts` and `templates/physics.ts` are aligned by hand and ignored by Prettier; keep
their column style when editing them.

## Things that have bitten before

- **Imports in `src/core` and `src/cli` name their `.ts` file** (`'./model.ts'`). `tsc` rewrites
  them (`rewriteRelativeImportExtensions`) and Node needs the extension at runtime.
- **The page renders only in the browser** (`ssr = false`), so it mounts before SvelteKit's router
  has started. Anything that calls `$app/navigation` on mount must wait for `afterNavigate`
  (see `MapApp.svelte`); `replaceState` threw otherwise and broke the first-visit intro.
- **The CLI must be executable in `dist/`.** `tsc` does not set the bit and npm silently drops a
  `bin` it cannot run; `build:lib` sets it. Check `npm publish --dry-run` for bin warnings.
- **Map files are loaded by Node itself** (type stripping, Node ≥ 22.18), not bundled, so a
  template may only use erasable TypeScript and must import from `'onboarding-map'`.
- **`validate()` issues carry a `path`** (`nodes.git`, `stages.setup`). Keep new checks in that
  shape; agents rely on it through `--json`.

## Commit messages

Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/): a type
from the Angular set (`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`,
`style`, `revert`), an optional scope, then a lowercase subject — `feat(cli): serve the map from a
subpath`. Use `!` or a `BREAKING CHANGE:` footer for breaking changes. The type decides the
release: `fix` → patch, `feat` → minor, breaking → major (minor while below 1.0).

Do not add `Co-Authored-By` or other attribution trailers.

Enforcement is server-side: `commitlint` checks the PR's commits and `pr-title` checks the PR
title, which becomes the commit on `main` under squash merge. There are no local hooks; run
`npx commitlint --from origin/main` to check a branch before pushing.

## How changes land

`main` is protected: changes arrive only through squash-merged PRs whose required checks pass. Work
in a linked worktree on a task branch, never in the main checkout or on `main`.

```bash
git worktree add artifacts/worktrees/<task-slug> -b <type>/<task-slug> origin/main
cd artifacts/worktrees/<task-slug> && npm install
```

Worktrees live under `artifacts/worktrees/`, which is ignored (also by Prettier and ESLint), so
they stay inside the repository.

- One PR per coherent task. Commit conventionally, push the branch, and open the PR with
  `gh pr create --head <branch> --title "<type(scope): subject>"` and a body following
  `.github/pull_request_template.md`: **Why**, **What changed**, **Evidence**, **Validation**,
  in short, plain sentences. Explain behavior before and after, not a file inventory.
- A PR is done when `check` (build, type check, lint, templates validate), `commitlint` and
  `pr-title` pass. Run `npm run build && npm run check && npm run lint` locally first.
- Address review by committing, or by rebasing and pushing with `--force-with-lease`.
- Each agent owns its worktree and branch: do not edit, reset, or delete another's, and never push
  to `main`.
- Remove your worktree (`git worktree remove`) and delete the branch once the PR is merged or
  abandoned.

## Releases

release-please keeps a release PR (`chore(main): release x.y.z`) open with the next version and
`CHANGELOG.md`. Merging it tags the release and the `Release` workflow publishes to npm with
Trusted Publishing — no token exists. Do not tag, bump `version`, edit `CHANGELOG.md` or run
`npm publish` by hand.

Only `feat`, `fix`, `perf`, `refactor`, `revert` and `deps` commits cause a release; the other
types land without one. When release-please updates its PR, GitHub holds that PR's check runs as
"action required" until a maintainer approves them (Actions → the run → "Approve workflows to
run"). A release PR whose checks show as waiting is not failing; ask the maintainer to approve.

## Verifying a change

- Core or CLI: exercise the command on a template and paste the output in **Evidence**, e.g.
  `node dist/cli/index.js validate --map templates/physics.ts --json`. For `init`/`build` changes,
  `npm pack` and install the tarball in a scratch folder, so the check sees what users get.
- App: build a map with this branch and with `main`, serve both, and compare:
  `node tools/shoot.mjs <new-url> <out> --baseline <main-url>` then `node tools/diff.mjs <out>`
  (needs `npx playwright install chromium` once). Put before/after captures in the PR. The
  `--states` selectors are stale; drive interactions yourself when they matter.
- A change to the model or to what the CLI prints can break map authors' agents: update the
  matching `skills/*/SKILL.md` in the same PR.
