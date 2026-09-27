---
title: Working with your agent
description: Write the map by hand, or let a coding agent draft it from your material.
---

There are two ways to make a map, and they mix.

**By hand.** The whole interface is one file. If you can describe your subject, you can write the
map; nothing needs an agent.

**With an agent.** Hand your notes, slides, syllabus or codebase to a coding agent, and let it do
the first draft. That is what the skills in this package are for: they tell the agent how to write,
edit and refresh a map.

## The skills

The package ships four short instructions, written for the agent rather than for you:

| Skill                  | What the agent uses it for                                       |
| ---------------------- | ---------------------------------------------------------------- |
| `onboarding-map-author` | The reference: the model, the conventions, the writing voice.    |
| `new-map`              | Draft a map for a new subject from your source material.         |
| `edit-map`             | Make a structural change to an existing map.                     |
| `refresh-stale`        | Fix dead links, changed sources and items nobody is sent to.     |

`init` installs them where your agent looks, and adds a short section to the project's `AGENTS.md`
pointing at them.

| Target   | Folder           | Read by                                                     |
| -------- | ---------------- | ----------------------------------------------------------- |
| `claude` | `.claude/skills` | Claude Code                                                 |
| `agents` | `.agents/skills` | Codex, and other tools following the Agent Skills standard  |
| `codex`  | `.codex/skills`  | Codex (older path)                                          |

Refresh them at any time, for example after upgrading the package:

```sh
npx onboarding-map skills install --target all
```

## What to ask

- _"Turn these notes into an onboarding map."_
- _"Add a region for observability and send the last stage through it."_
- _"The Kubernetes docs moved — refresh the stale links and tell me what you couldn't fix."_

The agent edits the file, runs `validate` until it is clean, and shows you a `changelog` of what
changed. You review it, and the map. The agent does the typing; the judgement about what belongs on
the path stays yours.
