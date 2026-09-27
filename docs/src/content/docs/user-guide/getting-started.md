---
title: Get started
description: Start a map project from a template, serve it, and build a static site.
---

## Requirements

Node 22.18 or later. The map file is loaded by Node itself (type stripping), so no build step is
needed to run it.

## Start a project

```sh
npx onboarding-map init my-map            # or: --template physics
cd my-map && npm install
npx onboarding-map dev                    # http://localhost:4321, reloads on save
```

`init` writes:

- `map.ts` — a map from the chosen template (`starter` by default; `physics` is a complete example
  outside software);
- `onboarding-map.config.json` — names the map file and the build folder;
- `package.json` with `dev`, `build`, `validate` and `audit` scripts;
- agent skills, installed where your coding agent looks for them (see
  [working with your agent](/user-guide/working-with-your-agent/)).

You can also start by hand: create a `map.ts`, add `"onboarding-map"` as a dev dependency, and
install the skills with `npx onboarding-map skills install`.

## Serve it

```sh
npx onboarding-map dev
```

The page reloads when you save the map, and lists validation problems in place of the map when
something does not resolve.

## Build it

```sh
npx onboarding-map build        # writes map.json + the app to ./dist
```

The output is a static site; serve it from any static host.

## Check it

```sh
npx onboarding-map validate     # exit 1 on errors
npx onboarding-map audit        # stale or unfinished content; never fails the build
```

Every problem has a `path` into the map (`nodes.git`, `stages.setup`). Add `--json` for
machine-readable output.

:::tip
Ask your coding agent to do the writing: _"turn these notes into an onboarding map"_, or
_"refresh the stale content"_. The skills the project ships tell it how.
:::
