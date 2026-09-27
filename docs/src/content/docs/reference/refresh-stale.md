---
title: Refresh stale content
description: Find and fix stale or unfinished content — dead links, changed sources, route items no one is sent to.
---

Use this when asked to update, refresh, clean up or check an existing map. Read
[writing a map](/user-guide/authoring-a-map/) first.

## 1. Collect the findings

```sh
npx onboarding-map audit --json              # fast, offline
npx onboarding-map audit --json --check-urls # also requests every link (slow; needs network)
```

Each finding has a `kind`, a `path` into the map, and a `message`:

| kind           | what to do                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dead-link`    | Find the page's new location (vendors move docs); replace the URL. If it's gone, find the best current equivalent or remove the link.                              |
| `todo-link`    | Find the real URL. Internal links usually need the human — list them rather than guessing.                                                                        |
| `source-newer` | A source document was updated after the content citing it was last checked. Compare every item listed and rewrite what changed; set that document's `reviewed` date. |
| `no-refs`      | Find which source the item or stage comes from and add `refs`. If it has none, leave it and say so.                                                               |
| `no-docs`      | Add one good official link.                                                                                                                                       |
| `unread`       | A route item the learner is never sent to: add it to the right stage's `read` (or a waypoint), or make it `context` if it isn't really on the route.               |

## 2. Fix in batches

Group by kind, fix, and run `npx onboarding-map validate --json` after each batch. Don't restructure
the journey here — if the audit reveals a structural problem (a stage no longer makes sense), stop
and propose it to the human; it's an [edit](/reference/edit-map/) job.

## 3. Report

Run `npx onboarding-map changelog` and give the human: what you fixed, what is left and why (e.g.
internal links only they can supply), and anything you rewrote based on general knowledge rather
than a source.
