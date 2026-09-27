---
name: edit-map
description: Make a targeted change to an existing onboarding map — add or split a stage, add items or a region, re-route the journey, swap a chosen tool for an alternative, rename or move things. Use for any structural edit that is not a new map and not a staleness sweep.
---

# Edit an onboarding map

Read `../onboarding-map-author/SKILL.md` first.

Before editing, find everything the change touches: search the map file for the ids involved. References are plain strings — `parent`, `stage`, `alternativeTo`, `waypoints`, `read`, step `nodes`, `edges`, `builtFrom`, `dependsOn`, `relations`, `delivers`, `contributes`, `refs`. `validate` catches dangling ones, but finding them first gives a coherent edit rather than a chain of fixes.

## Common edits

- **Add a stage**: give it the next `order` (renumber later stages), a `period`, 3–5 `waypoints` whose nodes carry `stage: '<new id>'`, and `delivers`/`contributes`. Check the route still runs clockwise (the warnings say).
- **Split a stage**: move half the waypoints and steps to the new stage and update those nodes' `stage`. If the old stage delivered a module, decide which half delivers it; the other `contributes`.
- **Swap a choice** (e.g. a different tool on the route): the new node becomes `path` with the `stage` and waypoint slot; the old one becomes `alternative` with `alternativeTo` pointing at the new one. Move other alternatives' `alternativeTo` too. Update `builtFrom`, steps and `read`.
- **Add a region**: pick its `order` by where the route should visit it and shift later regions' `order`.
- **Rename**: change `label`, not `id`. Ids are what learners' saved progress and links use.
- **Remove**: prefer turning an item into `context` over deleting it; the territory stays honest.

## Finish

`validate --json` until clean, then `npx onboarding-map changelog` and show it to the human. Bump `version` (minor for new content, patch for fixes).
