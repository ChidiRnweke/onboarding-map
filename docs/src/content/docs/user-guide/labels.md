---
title: Labels
description: Every piece of interface copy is a label; override only what differs for your audience.
---

`labels` is the map's interface copy. Everything has an English default written for any subject;
set only what differs for this audience. Placeholders in `{braces}` are filled by the renderer.

```ts
export default defineMap({
  // …
  labels: {
    period: 'Week',
    intro: 'Everything you will meet in your first week.',
    tip: { label: 'Ask Copilot' },
  },
});
```

Labels are merged one level deep: setting `tip.label` keeps the other `tip` defaults.

## Groups

| Group              | What it names                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| `pageTitle`        | Browser tab title.                                                        |
| `intro`            | The paragraph under the main title.                                       |
| `start`            | Text next to the centre of the map.                                       |
| `period`           | Name for a group of stages: `Day`, `Week`, `Module`.                      |
| `view`             | The focused / full map switch.                                            |
| `stagePosition`    | Top of the stage panel: `{period} {periodNumber}, stage {stage} of {total}`. |
| `legend`           | Legend card copy.                                                         |
| `method`           | `do`, `observe`, `read` — leads and titles.                               |
| `tip`              | The tip box: label, copy/copied, hint, reveal.                            |
| `checkpoint`       | The "you're done when" heading.                                           |
| `pager`            | Previous / next / complete buttons.                                       |
| `node`             | Node panel copy: back links, "on your route", alternatives, docs.         |
| `refs`             | The sources section.                                                      |
| `goal`             | The goal and module views.                                                |
| `bigPicture`       | The intro, the stage bridge and the look-back.                            |
| `periodOverview`   | What a period gives you.                                                  |
| `phases`           | The phases of a stage and their buttons.                                  |
| `aria`             | Landmarks and controls only screen readers hear.                          |
| `region`           | The region view.                                                          |
| `kind`             | The kind view.                                                            |
| `sources`          | Display names for `DocLink.source` keys (e.g. `vendor: 'Official docs'`). |

:::note
`period` is the most common override: a week-long onboarding sets `period: 'Week'`, and the journey
strip, stage panel and period overview all follow.
:::
