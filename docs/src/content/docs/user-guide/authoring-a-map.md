---
title: Writing a map
description: The data model, its conventions, and the voice of an onboarding map.
---

This is the reference for writing and editing a map. Read it before any change to a map file; the
other writing pages build on it.

A map is one file, named in `onboarding-map.config.json` (default `map.ts`, or `map.json`). In
TypeScript it is `export default defineMap({ … })`, and types come from
`import { defineMap } from 'onboarding-map'`, so type errors in your editor and `tsc` are real
feedback. The full schema is available with `npx onboarding-map schema`.

## The feedback loop — always

1. Edit the map file.
2. `npx onboarding-map validate --json` → fix every entry in `errors`. Repeat until `"ok": true`.
   Look at `warnings` too; they are usually worth fixing.
3. `npx onboarding-map changelog` → show the human what changed.
4. Suggest `npx onboarding-map dev` so they can look at it. Never commit unless asked.

Do not declare the work done while `validate` reports errors.

## The model

Two layers, kept apart.

### Territory

Everything a newcomer might meet.

- **`kinds`** — what sort of things items are in _this_ subject (`tool`/`concept`;
  `law`/`phenomenon`/`experiment`). `category` is built in; do not define it.
- **`domains`** (regions of the map) — `order` (0-based, clockwise from 12 o'clock), a `color`
  (hex), a one-line `tagline`, optional `summary`. 5–10 regions reads well.
- **`nodes`** — every item. `kind: 'category'` nodes are the groups inside a region and have no
  `parent`; every other node has a `parent` category in the same domain.
  - `status`: `path` (on the route; needs `stage`), `alternative` (a choice not taken; needs
    `alternativeTo`), or `context` (worth knowing it exists).
  - `summary` is the plain-language explanation shown in the panel. `docs` are links
    (`{ title, url, source }`, `url: 'TODO'` for one still to find). `variants` are the same idea
    in different settings. `refs` say where in the source documents it comes from.
  - `detail: 'focus' | 'full'` controls the focused vs full view; route items are always in focus.
- **`edges`** — cross-links outside the tree, `{ from, to, kind: 'verb-with-dashes' }`, read as
  "from _kind_ to".

### Journey

The route through the territory.

- **`stages`**, in `order` 1..n, grouped by `period` (a day, a week; named by `labels.period`,
  titled in `periods`). Each stage:
  - `title`, `feeling` (the first-person sentence the learner can say afterwards), `task`.
  - `waypoints`: 3–5 path nodes whose `stage` is this stage, in route order.
  - `do`, then `observe`, then `read` — the method is _do first, then observe, and only then
    read_. `do`/`observe` are steps: a string, or
    `{ text, tip?, tipKind?: 'copy' | 'reveal', note?: true, nodes?: [...] }`. `copy` tips are
    things to paste; `reveal` tips are hints to try without first; `note: true` gives the learner a
    place to write what they saw. `read` lists node ids.
  - `checkpoint`: how the learner knows they are done — observable, not "understands X".
  - `delivers` / `contributes`: goal modules.
- **`goal`** (optional but recommended): what the journey builds. `statement`, `doneWhen`,
  `story`, and `modules` with `purpose`, `dependsOn`, `relations`, `builtFrom`, `produces`. Every
  module is delivered by exactly one stage, after the modules it depends on.

### Provenance

`documents` lists the source material (`id`, `title`, `date`, `url`, optional `reviewed`); `refs`
on nodes, stages and modules point into it. The `ref(doc, ...slides)` helper writes them. When
content comes from a document, cite it — `audit` uses this to find stale content.

### Labels

`labels` is the interface copy. Everything has English defaults; set only what differs for this
audience (`period: 'Week'`, `tip: { label: 'Ask Copilot' }`, `intro`). See the
[labels reference](/user-guide/labels/).

## Conventions that make a good map

- The route moves clockwise: put regions in the order the journey visits them. `validate` warns
  when the route steps backwards or skips far.
- A stage has one idea. If `task` needs "and then", it is two stages.
- Every path node belongs to some goal module's `builtFrom` (else `validate` warns) and is a
  waypoint or in some stage's `read`.
- Alternatives are real choices the team made; say in `summary` why this one was not picked.
- Context nodes are cheap to add and make the territory honest; don't put them on the route.
- Ids are stable kebab-case; renaming one breaks references and learners' saved progress. Change
  labels freely.
- Keep `version` in the map: bump the minor version for new content, the patch version for fixes.

## Voice

Plain, concrete, second person, short sentences. Say what a thing _is for_ before what it is. No
marketing words, no "simply", no "powerful". A summary is 1–3 sentences a newcomer could repeat to
a colleague. A `feeling` is first person ("I can…", "I know where…").
