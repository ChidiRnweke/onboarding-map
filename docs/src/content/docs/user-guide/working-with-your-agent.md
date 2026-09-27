---
title: Working with your agent
description: The skills the package installs, where they go, and what to ask your coding agent.
---

A map is written by your coding agent, not by hand. The package ships four skills that tell the
agent how — the model, the conventions, the voice, and the validate → changelog loop.

## Where the skills go

`init` asks which coding agents should get the skills, and installs them where each looks:

| Target   | Folder          | Read by                                                   |
| -------- | --------------- | --------------------------------------------------------- |
| `claude` | `.claude/skills` | Claude Code                                              |
| `agents` | `.agents/skills` | Codex, and other tools following the Agent Skills standard |
| `codex`  | `.codex/skills`  | Codex (older path)                                       |

It also writes an `onboarding-map` section into the project's `AGENTS.md`, pointing at the skills so
any agent that reads it finds them.

Install or refresh them at any time:

```sh
npx onboarding-map skills install --target all
```

When nobody can be asked (CI, an agent's shell), pass `--target` explicitly.

## The four skills

| Skill                  | Use it to                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| `onboarding-map-author` | The reference: model, conventions, voice, the validate loop.    |
| `new-map`              | Draft a map for a new subject from source material.             |
| `edit-map`             | Make a targeted structural change to an existing map.           |
| `refresh-stale`        | Find and fix dead links, changed sources and unread route items. |

## What to ask

- _"Turn these notes into an onboarding map."_
- _"Add a region for observability and route the last stage through it."_
- _"The Kubernetes docs moved — refresh the stale links and tell me what you couldn't fix."_

The agent edits the map, runs `validate` until it is clean, and shows you a `changelog` of what
changed. You review it and the diff.
