---
title: Writing a map
description: The craft of a good map — what to put on the path, how to cut it into stages, and the voice to write it in.
---

A map is one file. In TypeScript it is `export default defineMap({ … })`, and the types come from
the package, so mistakes show up in your editor as you type. ([`map.json`](/reference/schema/) works
too, when another tool has to write the file.)

The field-by-field reference is in [the model](/reference/model/). This page is about writing a good
one.

## Put your subject on the map

Start with everything a newcomer might meet, grouped into a handful of regions. Then mark each item:

- the ones they will actually use go **on the path**;
- the choices the team considered and set aside stay visible, with the reason they were not taken;
- everything else is there so the map is honest about what exists.

A useful ratio is a small path and a lot of surroundings. The surroundings are what stop the newcomer
wondering what they are missing.

## Cut the path into stages

Each stage carries one idea and ends with something the newcomer can show. If your description of a
stage needs "and then", it is two stages.

Inside a stage, write the steps in the order they happen: do, then observe, then read. Point the
reading at the items the path just used.

## The loop while you write

1. Edit the file.
2. `npx onboarding-map validate --json` and fix every error. Each one names the part to fix.
3. `npx onboarding-map changelog` to see what changed, and `npx onboarding-map dev` to look at it.

Do not call it done while `validate` reports errors.

## Conventions that make a good map

- Move around the map in one direction. Put regions in the order the path visits them; the checks
  warn when the path doubles back.
- Every item on the path should belong to something the journey builds, and be something the
  newcomer is sent to. `validate` warns when it is not.
- Keep item names short and stable. Changing an item's label is free; changing its id breaks links
  and the progress saved in a reader's browser.
- Bump the map's version as it changes: minor for new content, patch for fixes.

## Voice

Plain, concrete, second person, short sentences. Say what a thing _is for_ before what it is. No
marketing words, no "simply", no "powerful". A summary is one to three sentences a newcomer could
repeat to a colleague. A stage's feeling is first person ("I can…", "I know where…").
