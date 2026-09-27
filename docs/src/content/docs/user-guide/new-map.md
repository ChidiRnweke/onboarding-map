---
title: Create a new map
description: Build an onboarding map for a new subject from the source material, in passes.
---

Use this when making, drafting or generating an onboarding map, or replacing the starter map. Read
[writing a map](/user-guide/authoring-a-map/) first; it defines the model and the loop this page
relies on.

## 1. Understand the brief (ask if not given)

- **Who** is onboarding, and what do they already know?
- **What** should they be able to do at the end? This becomes the `goal`.
- **How long** — days, weeks? This sets `labels.period` and the number of stages (typically 6–12).
- **Sources**: which documents, repositories or pages to base it on. Read them; don't invent facts a
  source should provide. Where you rely on general knowledge instead, say so.

## 2. Draft in this order, validating as you go

Build the file in passes; run `npx onboarding-map validate --json` after each.

1. **Header**: `id` (kebab-case, stable), `version: '0.1.0'`, `title`, `motto`, the `labels` that
   differ from the defaults, and `documents` for every source you used.
2. **Kinds**: 2–4 kinds that fit the subject.
3. **Goal**: the finished thing, as 3–7 modules with dependencies. This is the spine — the stages
   exist to build it.
4. **Regions** (`domains`) and their **categories**, ordered so the route can travel clockwise.
5. **Route nodes** (`status: 'path'`), each with a `stage`, `summary`, `docs` where a good public
   link exists, and `refs` to the source.
6. **Stages**: for each module in dependency order, the stage(s) that build it — waypoints,
   Do → Observe → Read, checkpoint, `delivers`.
7. **Territory**: `alternative` nodes for the choices made and `context` nodes for what's worth
   recognising. Roughly 2–4× as many as route nodes.
8. **Edges** for relations that matter across regions.

## 3. Hand over

- `validate` passes with no errors, and you have addressed the warnings or explained why not.
- Run `npx onboarding-map audit` and tell the human what is still open (e.g. links marked `TODO`).
- Tell them to run `npx onboarding-map dev` and walk the route; offer to adjust stages that feel too
  big.
