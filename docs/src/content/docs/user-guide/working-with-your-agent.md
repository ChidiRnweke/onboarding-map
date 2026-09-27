---
title: Working with your agent
description: Use the installed skills to let your agent draft, edit and check the map file.
---

The map file holds the territory, route, stage instructions, links and sources. A complete map can
be long, so the practical way to write and maintain it is with a coding agent. You provide the
source material and review the choices; the agent does the structured editing and checks.

## Start with a new map

Run `npx onboarding-map init my-map`. It creates `map.ts`, installs the skills for your agent and
adds a pointer to them in `AGENTS.md`. If the command runs without an interactive terminal, add
`--target agents` (or the target your agent reads). Give the agent your source material and ask it to
make a map for a specific learner and goal. For example:

> Turn these notes into an onboarding map for a new teammate. Draft `map.ts`, validate it, and tell
> me which parts of the route need my decision.

The `new-map` skill asks the agent to understand the audience and sources before it drafts. You
review the route and the content; ask it to revise anything that is unsupported or out of order.

## The skills

The package ships four skills, written for the agent:

| Skill                  | What the agent uses it for                                       |
| ---------------------- | ---------------------------------------------------------------- |
| `onboarding-map-author` | The reference: the model, the conventions, the writing voice.    |
| `new-map`              | Draft a map for a new subject from your source material.         |
| `edit-map`             | Make a structural change to an existing map.                     |
| `refresh-stale`        | Fix dead links, changed sources and items nobody is sent to.     |

`init` installs them where your agent looks and adds a short section to the project's `AGENTS.md`
that points to them. For an existing map, install or update them with:

```sh
npx onboarding-map skills install --target agents
```

Replace `agents` with `claude`, `codex`, a comma-separated list or `all` to match your setup. Use
`none` only when you do not want to install skills.

| Target   | Folder           | Read by                                                     |
| -------- | ---------------- | ----------------------------------------------------------- |
| `claude` | `.claude/skills` | Claude Code                                                 |
| `agents` | `.agents/skills` | Codex, and other tools following the Agent Skills standard  |
| `codex`  | `.codex/skills`  | Codex (older path)                                          |

## What to ask

- _"Turn these notes into an onboarding map."_
- _"Add a region for observability and send the last stage through it."_
- _"The Kubernetes docs moved — refresh the stale links and tell me what you couldn't fix."_

Ask the agent to run `validate` until it reports no errors, then show you the `audit` findings and
`changelog`. Open the site with `npx onboarding-map dev` and review the route. The agent maintains
the file; you decide what the learner needs to do and what can wait.
