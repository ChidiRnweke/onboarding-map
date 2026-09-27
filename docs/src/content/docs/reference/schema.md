---
title: JSON Schema
description: Validate and autocomplete map.json in your editor.
---

`npx onboarding-map schema` prints the JSON Schema generated from the `OnboardingMap` type. Point
your editor at it to get validation and autocomplete for a `map.json`:

```json
{
  "$schema": "./node_modules/onboarding-map/schema.json",
  "title": "Your first week",
  "motto": "Do, observe, read, repeat."
}
```

The package also exports the same file as `onboarding-map/schema.json`, so a project can reference it
directly.

## Why a map is usually TypeScript

A `map.ts` gives you the types at author time, without a schema file: `defineMap` is typed, so a
wrong field or a bad reference shows up in your editor and in `tsc` immediately. Use `map.json` when
a non-TypeScript tool needs to write or read the map.

Either way, `validate` is the check that matters — it resolves every reference, which a JSON Schema
alone cannot.
