---
name: onboarding-map-author
description: Reference for writing and editing an onboarding map (the `onboarding-map` package) — the data model, its conventions, the writing voice, and the validate → changelog loop. Read it before any change to a map file; the other onboarding-map skills build on it.
---

# Writing an onboarding map

An onboarding map shows a newcomer everything in a subject — cloud platforms, a codebase, introductory physics — as a radial map, with one highlighted route through it. The learner follows the route in stages; the rest is territory to _recognise_, not learn.

The map is one file, named in `onboarding-map.config.json` (default `map.ts`, or `map.json`). In TypeScript it is `export default defineMap({ … })`; types come from `import { defineMap } from 'onboarding-map'`, so type errors in your editor and `tsc` are real feedback. The full schema: `npx onboarding-map schema`.

## The feedback loop — always

1. Edit the map file.
2. `npx onboarding-map validate --json` → fix every entry in `errors` (each has a `path` like `nodes.git` or `stages.setup` and a `message`). Repeat until `"ok": true`. Look at `warnings` too; they are usually worth fixing.
3. `npx onboarding-map changelog` → show the human what changed (it compares with the last commit; `--against <rev>` for another point).
4. Suggest `npx onboarding-map dev` so they can look at it. Never commit unless asked.

Do not declare the work done while `validate` reports errors.

## The model

Two layers, kept apart.

**Territory** — everything a newcomer might meet.

- `kinds`: what sort of things items are in _this_ subject (`tool`/`concept`; `law`/`phenomenon`/`experiment`). `category` is built in; don't define it.
- `domains` (regions of the map): `order` (0-based, clockwise from 12 o'clock), a `color` (hex), a one-line `tagline`, optional `summary`. 5–10 regions reads well.
- `nodes`: every item. `kind: 'category'` nodes are the groups inside a region and have no `parent`; every other node has a `parent` category in the same domain.
  - `status`: `path` (on the route; needs `stage` = the stage it is first used), `alternative` (a choice not taken; needs `alternativeTo` = the path node it could replace), `context` (worth knowing it exists).
  - `summary`: plain-language explanation shown in the panel. `docs`: links (`{ title, url, source }`; `url: 'TODO'` for a link still to find). `variants`: the same idea in different settings. `refs`: where in the source documents it comes from.
  - `detail: 'focus' | 'full'` controls the focused vs full view; route items are always in focus.
- `edges`: cross-links outside the tree, `{ from, to, kind: 'verb-with-dashes' }`, read as “from _kind_ to”.

**Journey** — the route through the territory.

- `stages`, in `order` 1..n, grouped by `period` (a day, a week; named by `labels.period`, titled in `periods`). Each stage:
  - `title`, `feeling` (the first-person sentence the learner can say afterwards), `task` (one or two sentences).
  - `waypoints`: 3–5 path nodes whose `stage` is this stage, in route order.
  - `do`, then `observe`, then `read` — the method is _do first, then observe, and only then read_. `do`/`observe` are steps: a string, or `{ text, tip?, tipKind?: 'copy' | 'reveal', note?: true, nodes?: [...] }`. `copy` tips are things to paste (a command, a prompt); `reveal` tips are hints the learner should try without first. `note: true` gives them a place to write what they saw. `read` lists node ids.
  - `checkpoint`: how the learner knows they are done — observable, not “understands X”.
  - `delivers` / `contributes`: goal modules.
- `goal` (optional but recommended): what the journey builds. `statement`, `doneWhen`, `story` (the big picture before any part exists), `modules`, each with `purpose`, `dependsOn`, `relations` (`{ to, verb }` for each dependency, read “this _verb_ that”), `builtFrom` (node ids), `produces`. Every module is delivered by exactly one stage, after the modules it depends on.

**Provenance**: `documents` lists the source material (`id`, `title`, `date`, `url`, optional `reviewed`); `refs: [{ doc, slides? }]` on nodes, stages and modules point into it. The `ref(doc, ...slides)` helper writes them. When content comes from a document, cite it — `audit` uses this to find stale content.

**Assistant**: every map has an agent that helps learners: it explains a step, a concept, a connection or a region where they are looking, checks a step's note when asked, and points at the map. Learners bring their own key; nothing in the map is secret. Set `assistant: { enabled: false }` only if the author does not want it. Optional presets: `provider` (`openrouter`, `anthropic`, `openai`, `google`, `azure`, `ollama`, `lmstudio`, `custom`), `model` (Azure: the deployment name), `baseURL` (needed for `azure` and `custom`), `instructions` (house rules for the model), `keyless` (an organisation proxy at `baseURL` holds the key). The better the `summary`, `task`, `checkpoint`, step `nodes` and domain `summary`, the better its answers: it reads the map, not the web.

**Labels**: interface copy. Everything has English defaults; set only what differs for this audience (`period: 'Week'`, `tip: { label: 'Ask Copilot' }`, `intro`).

## Conventions that make a good map

- The route moves clockwise: put regions in the order the journey visits them. `validate` warns when the route steps backwards or skips far.
- A stage has one idea. If `task` needs “and then”, it is two stages.
- Every path node belongs to some goal module's `builtFrom` (else `validate` warns) and is a waypoint or in some stage's `read`.
- Alternatives are real choices the team made; say in `summary` why this one was not picked.
- Context nodes are cheap to add and make the territory honest; don't put them on the route.
- Ids are stable kebab-case; renaming one breaks references and learners' saved progress on that stage. Change labels freely.
- Keep `version` in the map: bump the minor version for new content, the patch version for fixes.

## Voice

Plain, concrete, second person, short sentences. Say what a thing _is for_ before what it is. No marketing words, no “simply”, no “powerful”. A summary is 1–3 sentences a newcomer could repeat to a colleague. `feeling` is first person (“I can…”, “I know where…”).
