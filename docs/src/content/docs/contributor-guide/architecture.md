---
title: Architecture
description: Where things live in the repository and how a map becomes a site.
---

`onboarding-map` is an npm package that renders an onboarding map for any subject. A user's project
holds one map file (`map.ts` or `map.json`); the CLI validates it and serves or builds it next to a
prebuilt SvelteKit shell.

## Where things live

| Path                      | Holds                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/`               | The data model (`model.ts`: types, `validate`, `derive`), labels, `changelog`, `audit`, map loading. No Svelte; runs in Node and the browser.                  |
| `src/cli/`                | The `onboarding-map` command (citty): `init`, `dev`, `build`, `validate`, `changelog`, `audit`, `schema`, `skills install`.                                     |
| `src/routes/`, `src/lib/` | The app: a static shell that fetches `map.json` at runtime and renders it.                                                                                      |
| `templates/`              | Maps that `init --template` copies. `starter` is minimal; `physics` is a complete example outside software.                                                     |
| `skills/`                 | **Product, not instructions for working here.** Skills shipped to map authors' coding agents by `init` and `skills install`.                                    |
| `docs/`                   | This documentation site (Astro + Starlight).                                                                                                                    |
| `tools/`                  | Visual regression: `shoot.mjs` screenshots two served builds, `diff.mjs` pixel-diffs them.                                                                      |

## How a build fits together

`npm run build`:

1. compiles `src/core` + `src/cli` with `tsc` to `dist/core` and `dist/cli` (`build:lib`);
2. generates `schema/map.schema.json` from `OnboardingMap` (`build:schema`);
3. builds the SvelteKit static shell to `dist/app`.

The CLI's `build` command copies `dist/app` next to a map's `map.json`. A map project imports
`src/core` as `onboarding-map`.

## A change to the model reaches other files

`src/core/model.ts` is the contract. When it or what the CLI prints changes, the matching
`skills/*/SKILL.md` and the user-guide pages here change in the same PR — map authors' agents depend
on both.
