---
title: Overview
description: What an onboarding map is, the two layers it keeps apart, and the do → observe → read method.
---

An onboarding map shows a newcomer everything in a subject — a cloud platform, a codebase,
introductory physics — as a radial map, with one highlighted route through it. The learner follows
the route in stages; the rest of the map is territory to _recognise_, not learn.

![An onboarding map for a cloud team: regions of the map around a centre, the route of the first stage highlighted, and the stage panel with the goal as a diagram](/screenshot.png)

The map keeps two layers apart:

**Territory** — everything a newcomer might meet.

- **Regions** (`domains`) are the slices of the map, ordered clockwise from 12 o'clock.
- **Categories** are the groups inside a region.
- **Items** are the individual things. Each is one of three things:
  - on the **route** (`path`) — the learner touches it during onboarding;
  - an **alternative** — a real choice the team did not pick;
  - **context** — worth knowing it exists, not required.

**Journey** — the route through the territory.

- **Stages** are walked in order, grouped into periods (a day, a week).
- Each stage is a **do → observe → read** pass over a few route items, and ends with a checkpoint:
  how the learner knows they are done.
- A stage **delivers** part of the **goal** — the finished thing the journey builds, told as a
  handful of modules the learner can see assembled.

## Why a coding agent writes it

You do not write the map by hand, and you do not need a CMS. Your coding agent writes and maintains
the map from your source material (notes, docs, slides, a codebase), using the skills the package
installs. The CLI checks its work: every reference must resolve, and `audit` finds stale content.

## What you get

A static site: a prebuilt shell plus your `map.json`. Serve it from any static host. A learner's
progress, notes and "seen the big picture" flag are kept in their own browser, so there is no
server and no account.

:::tip
The quickest way to see one is the live map on the [home page](/). It is the `physics` template —
a complete example outside software.
:::

Next: [get started](/user-guide/getting-started/).
