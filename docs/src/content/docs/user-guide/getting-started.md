---
title: Get started
description: From an empty folder to a map you can send.
---

You need Node 22.18 or later, and a subject you want to onboard someone into.

## Start a project

```sh
npx onboarding-map init my-map
cd my-map && npm install
```

That gives you one file, `map.ts`, holding a short example map, plus the agent skills and a few
scripts. The name of the file is set in `onboarding-map.config.json`.

## Put your subject in

Open `map.ts`. It starts as a tiny example — a couple of regions and two stages. Replace it with
your subject, or ask your coding agent to:

> Turn these notes into an onboarding map.

Point the agent at your material (notes, slides, a syllabus, a codebase). It drafts the file; you
decide what belongs on the path. See [working with your agent](/user-guide/working-with-your-agent/).

## See it while you write

```sh
npx onboarding-map dev        # http://localhost:4321
```

The page reloads on every save. When something in the file does not add up, the page says so instead
of showing the map.

## Check it

```sh
npx onboarding-map validate   # every reference resolves; exit 1 if not
npx onboarding-map audit      # stale or unfinished content
```

Fix what `validate` reports. `audit` never fails the build — it is a to-do list: dead links, sources
that changed, items nobody is sent to.

## Send it

```sh
npx onboarding-map build      # writes the site to ./dist
```

Upload `dist/` to any static host. That is the map the newcomer opens.

:::tip
Start from a finished example instead of an empty one:

```sh
npx onboarding-map init my-map --template physics
```

:::
