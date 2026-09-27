---
title: Writing a map
description: A map is one file, but a complete one is long. Use the agent skills to draft it, then shape the route and review the result.
---

The map is one file: usually `map.ts`, exported with `defineMap`. A complete map can be hundreds of
lines because it records the territory, route, stage instructions, links and sources. You can write
it by hand, but most people should use a coding agent and the skills installed by
[`init`](/user-guide/getting-started/).

Give the agent your notes, documentation, slides or codebase. The `new-map` skill guides the first
draft; the `onboarding-map-author` skill gives it the model, conventions and writing voice. You
decide who the learner is, what they should be able to do, and which steps belong on the route.

## Shape the map

Start with the important parts of the subject and group them into a few regions. Classify each item:

- put items the learner will use on the **path**;
- keep useful nearby items as **context**;
- mark real choices the team rejected as **alternatives**, and say why.

Keep the path selective. The territory supplies context; the path tells the learner what to do first.

## Make each stage usable

Give each stage one outcome and an observable checkpoint. If its task needs “and then”, split it.
Point its waypoints and reading at the map items the learner will meet.

Keep the steps in order: **do**, **observe**, then **read**. Start with something the learner can try;
the reading will make more sense after they have seen it.

## Review the draft

Ask the agent to run the checks and show you the route. Then open the map yourself and decide what
to change:

```sh
npx onboarding-map validate --json
npx onboarding-map audit
npx onboarding-map changelog
npx onboarding-map dev
```

`validate` must report no errors before the map can build. `audit` points out missing or stale
content; review its findings with your sources. Use `dev` to walk the route before sharing it.

For the full list of fields, see the [model reference](/reference/model/). For agent prompts and
maintenance tasks, see [working with your agent](/user-guide/working-with-your-agent/).
