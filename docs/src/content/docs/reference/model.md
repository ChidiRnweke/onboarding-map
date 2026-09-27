---
title: The map model
description: The OnboardingMap type — every top-level field and what it holds.
---

Your `map.ts` or `map.json` exports one `OnboardingMap` object. The full TypeScript type is in
`src/core/model.ts`; this page explains the fields. For the idea behind each part, see
[How it works](/user-guide/how-it-works/). `npx onboarding-map schema` prints the JSON Schema.

## Top level

| Field       | Required | Holds                                                                                        |
| ----------- | -------- | -------------------------------------------------------------------------------------------- |
| `$schema`   | no       | Schema reference for editors. Ignored by the renderer.                                       |
| `id`        | no       | Stable name, used to keep a learner's progress apart from other maps. Defaults to the title. |
| `version`   | yes      | The map's own version. Bump minor for content, patch for fixes.                              |
| `title`     | yes      | The map's title.                                                                             |
| `motto`     | yes      | One line under the title.                                                                    |
| `labels`    | no       | Interface copy; anything left out uses the English defaults.                                 |
| `goal`      | no       | The finished thing the journey builds. A map without a goal still works as a plain journey.  |
| `kinds`     | yes      | The kinds of item this map uses (`category` is built in).                                    |
| `periods`   | no       | Names for the groups stages fall into (a day, a week).                                       |
| `documents` | no       | The source documents that `refs` point at.                                                   |
| `domains`   | yes      | The regions of the map.                                                                      |
| `nodes`     | yes      | Every item.                                                                                  |
| `edges`     | yes      | Cross-links outside the category tree.                                                       |
| `stages`    | yes      | The journey, in order.                                                                       |

## The territory

- **`kinds` / `KindDef`** name the subject-specific items, such as a `tool`, `law` or `concept`.
  Each definition has an `id`, singular `label`, `plural` and `description`. The built-in kind
  `category` groups items; do not define it yourself.
- **`domains` / `Domain`** are the map regions. Give each an `id`, `label`, one-line `tagline`, a
  clockwise `order` (starting at 0) and a hex `color`. `summary` and `shortLabel` are optional.
- **`nodes` / `MapNode`** are the categories and subject items. Every node has an `id`, `label`,
  `domain`, `kind`, `status` and `summary`. Every non-category item needs a `parent` category.
  `status` is `path`, `context` or `alternative`; route items also name their `stage`, and
  alternatives name the path item in `alternativeTo`. Optional fields add `docs`, source `refs`,
  `variants`, display `detail`, a `reveal` stage and `tags`.
- **`edges` / `MapEdge`** add cross-links outside the parent/category tree: `from`, `to`, `kind` and
  optional display `label`.

## The journey

- **`periods` / `Period`** group stages, for example into days or weeks. Each has a numeric `period`,
  a `title` and optional `summary`.
- **`stages` / `Stage`** make up the route. A stage has an `id`, `period`, `order`, `title`,
  first-person `feeling`, `task`, `waypoints`, `do`, `observe`, `read` and a `checkpoint`. Optional
  `delivers` and `contributes` connect it to goal modules; `bridge` explains its place in the goal.
- A **`Step`** is a string, or `{ text, tip?, tipKind?: 'copy'|'reveal', note?, nodes? }`. A `tip`
  adds a prompt, hint or answer; `note` gives the learner a place to write; `nodes` link the step to
  map items.
- **`goal` / `Goal`** describes the finished result with `title`, `statement`, `doneWhen`, optional
  `story` and `modules`.
- **`GoalModule`** has an `id`, `title`, `purpose`, `dependsOn`, `builtFrom` node ids and `produces`.
  Optional `relations` name how modules connect; `optional` marks a module the learner can skip.

## Sources and interface copy

`documents` lists the source material behind a map. `refs` on nodes, stages and goal modules point
back to those documents; `docLink` creates learner-facing links, while `ref` cites the source used
to write the map.

`labels` overrides interface text. See the [labels reference](/reference/labels/) for the groups and
the [JSON Schema page](/reference/schema/) for `map.json` editor support.

:::tip
`defineMap`, `docLink`, `todoLink` and `ref` are exported by the package. Use them to keep a map
readable and its links consistent:

```ts
import { defineMap, docLink, ref } from 'onboarding-map';

const learn = docLink('microsoft-learn', 'https://learn.microsoft.com/');

export default defineMap({
  /* … */
});
```

:::
