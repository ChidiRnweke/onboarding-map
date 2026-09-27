---
title: The map model
description: The OnboardingMap type — every top-level field and what it holds.
---

The map is a single `OnboardingMap` object. The full type is in `src/core/model.ts`; this page is
the field-by-field summary. `npx onboarding-map schema` prints the JSON Schema.

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

## Territory

- **`KindDef`** — `id`, `label`, `plural`, `description`. One kind is structural: `category`.
- **`Domain`** — `id`, `label`, `tagline`, optional `summary`/`shortLabel`, `order` (0-based,
  clockwise), `color` (hex), optional `detail`.
- **`MapNode`** — `id`, `label`, `domain`, `kind`, `status` (`path`/`alternative`/`context`),
  `parent` (a category id), `summary`, plus `stage` (path nodes), `alternativeTo` (alternatives),
  `docs`, `refs`, `variants`, `detail`, `reveal`, `tags`.
- **`Step`** — a string, or `{ text, tip?, tipKind?: 'copy'|'reveal', note?, nodes? }`.
- **`MapEdge`** — `from`, `to`, `kind`, optional `label`.

## Journey

- **`Stage`** — `id`, `period`, `order`, `title`, `feeling`, `task`, `waypoints`, `do`, `observe`,
  `read`, `checkpoint`, optional `delivers`, `contributes`, `bridge`, `refs`.
- **`Goal`** — `title`, `statement`, `doneWhen`, optional `story`, and `modules`.
- **`GoalModule`** — `id`, `title`, `purpose`, `dependsOn`, optional `relations`, `builtFrom`,
  `produces`, optional `optional`, `refs`.

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
