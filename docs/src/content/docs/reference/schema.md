---
title: JSON Schema
description: Validate and autocomplete map.json in your editor.
---

`npx onboarding-map schema` prints the JSON Schema generated from the `OnboardingMap` type. Point
your editor at it to get field validation and autocomplete for `map.json`. Here is a small complete
map file:

```json
{
  "$schema": "./node_modules/onboarding-map/schema/map.schema.json",
  "version": "0.1.0",
  "title": "Your first week",
  "motto": "Do, observe, read, repeat.",
  "kinds": [
    {
      "id": "concept",
      "label": "Concept",
      "plural": "Concepts",
      "description": "An idea the learner needs to use."
    }
  ],
  "domains": [
    {
      "id": "basics",
      "label": "Basics",
      "tagline": "The first things to learn.",
      "order": 0,
      "color": "#2563EB"
    }
  ],
  "nodes": [
    {
      "id": "first-steps",
      "label": "First steps",
      "domain": "basics",
      "kind": "category",
      "status": "path",
      "summary": "The ideas used in the first task."
    },
    {
      "id": "open-project",
      "label": "Open the project",
      "domain": "basics",
      "kind": "concept",
      "parent": "first-steps",
      "status": "path",
      "stage": "start",
      "summary": "Find the project files and open them in your editor."
    },
    {
      "id": "make-change",
      "label": "Make a change",
      "domain": "basics",
      "kind": "concept",
      "parent": "first-steps",
      "status": "path",
      "stage": "start",
      "summary": "Change one small thing in the project."
    },
    {
      "id": "review-change",
      "label": "Review the change",
      "domain": "basics",
      "kind": "concept",
      "parent": "first-steps",
      "status": "path",
      "stage": "start",
      "summary": "Check the change before sharing it."
    }
  ],
  "edges": [],
  "stages": [
    {
      "id": "start",
      "period": 1,
      "order": 1,
      "title": "Make a first change",
      "feeling": "I can make and review a small change.",
      "task": "Open the project, change one thing, and review it.",
      "waypoints": ["open-project", "make-change", "review-change"],
      "do": ["Open the project and make a small change."],
      "observe": ["Check which files changed."],
      "read": ["open-project"],
      "checkpoint": "You can show the change and explain what it does."
    }
  ]
}
```

The package also exports the same schema as `onboarding-map/schema.json`. The `$schema` path above
points to the file inside an installed package; it assumes `onboarding-map` is in `node_modules`.

## Why a map is usually TypeScript

A `map.ts` gives you types at author time through `defineMap`. Use `map.json` when a non-TypeScript
tool needs to write or read the map.

Schema validation checks the shape of the file. `npx onboarding-map validate` also resolves
references between regions, items and stages; a JSON Schema cannot check those connections.
